#!/usr/bin/env node

/**
 * GitHub Repository Selector for Portfolio
 * 
 * This script fetches all public repositories for a GitHub user,
 * analyzes them based on various criteria, scores them, and selects
 * the top 10 repositories for portfolio display.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_USER = 'EL-HOUSS-BRAHIM';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'selected-github-projects.json');

// Check for command line arguments
const args = process.argv.slice(2);
const JSON_ONLY = args.includes('--json-only');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

// Image extensions to look for in repo root
const IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

// Image preference order
const IMAGE_PREFERENCE_NAMES = ['logo', 'icon', 'screenshot'];
const IMAGE_PREFERENCE_TYPES = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

/**
 * Make an HTTPS GET request
 */
function httpsGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const defaultHeaders = {
            'User-Agent': 'Node.js GitHub Portfolio Selector',
            ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}),
            ...headers
        };

        https.get(url, { headers: defaultHeaders }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Fetch all public repositories for a user
 */
async function fetchUserRepos(username) {
    if (!JSON_ONLY) console.log(`Fetching repositories for user: ${username}...`);
    const repos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `https://api.github.com/users/${username}/repos?type=public&per_page=100&page=${page}`;
        const pageRepos = await httpsGet(url);
        
        if (pageRepos.length === 0) {
            hasMore = false;
        } else {
            repos.push(...pageRepos);
            page++;
        }
    }

    if (!JSON_ONLY) console.log(`Found ${repos.length} public repositories`);
    return repos;
}

/**
 * Fetch repository README content
 */
async function fetchReadme(owner, repo, defaultBranch) {
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
        const response = await httpsGet(url);
        
        if (response.content) {
            const content = Buffer.from(response.content, 'base64').toString('utf-8');
            return content;
        }
    } catch (e) {
        // README not found or error
        return null;
    }
    return null;
}

/**
 * Fetch repository root file listing
 */
async function fetchRootFiles(owner, repo, defaultBranch) {
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents?ref=${defaultBranch}`;
        const files = await httpsGet(url);
        
        if (Array.isArray(files)) {
            return files.map(f => ({
                name: f.name,
                path: f.path,
                type: f.type,
                download_url: f.download_url
            }));
        }
    } catch (e) {
        // Error fetching files
        return [];
    }
    return [];
}

/**
 * Extract first image URL from README markdown
 */
function extractReadmeImage(readmeContent) {
    if (!readmeContent) return null;

    // Match markdown image syntax: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
    const match = readmeContent.match(imageRegex);

    if (match && match[2]) {
        return match[2];
    }

    return null;
}

/**
 * Resolve relative image URL to absolute raw.githubusercontent.com URL
 */
function resolveImageUrl(imageUrl, owner, repo, defaultBranch) {
    if (!imageUrl) return null;

    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Remove leading ./ or /
    const cleanPath = imageUrl.replace(/^\.?\//, '');

    // Construct raw.githubusercontent.com URL
    return `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cleanPath}`;
}

/**
 * Score image preference by filename
 */
function scoreImageName(filename) {
    const lower = filename.toLowerCase();
    
    for (let i = 0; i < IMAGE_PREFERENCE_NAMES.length; i++) {
        if (lower.includes(IMAGE_PREFERENCE_NAMES[i])) {
            return IMAGE_PREFERENCE_NAMES.length - i;
        }
    }
    
    return 0;
}

/**
 * Score image preference by type
 */
function scoreImageType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const index = IMAGE_PREFERENCE_TYPES.indexOf(ext);
    
    if (index !== -1) {
        return IMAGE_PREFERENCE_TYPES.length - index;
    }
    
    return 0;
}

/**
 * Find best image in repository root
 */
function findRootImage(files, owner, repo, defaultBranch) {
    const imageFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return f.type === 'file' && IMAGE_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) return null;

    // Score and sort images
    const scoredImages = imageFiles.map(img => ({
        ...img,
        nameScore: scoreImageName(img.name),
        typeScore: scoreImageType(img.name)
    }));

    // Sort by name score (desc), then type score (desc)
    scoredImages.sort((a, b) => {
        if (b.nameScore !== a.nameScore) {
            return b.nameScore - a.nameScore;
        }
        return b.typeScore - a.typeScore;
    });

    const bestImage = scoredImages[0];
    return resolveImageUrl(bestImage.name, owner, repo, defaultBranch);
}

/**
 * Check if repository was pushed within last 12 months
 */
function isRecentActivity(pushedAt) {
    if (!pushedAt) return false;
    
    const pushDate = new Date(pushedAt);
    const now = new Date();
    const twelveMonthsAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    
    return pushDate >= twelveMonthsAgo;
}

/**
 * Extract one-line summary from README
 */
function extractReadmeSummary(readmeContent) {
    if (!readmeContent) return null;

    // Remove title lines (starting with #)
    const lines = readmeContent.split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#'))
        .map(line => line.trim());

    // Find first non-empty line that's not a badge or image
    for (const line of lines) {
        if (line.length > 20 && 
            !line.startsWith('!') && 
            !line.startsWith('[!') &&
            !line.startsWith('[![')) {
            return line.length > 150 ? line.substring(0, 150) + '...' : line;
        }
    }

    return null;
}

/**
 * Generate portfolio title from repo name
 */
function generatePortfolioTitle(repoName, description, readme) {
    // If description exists, use it
    if (description) {
        return description.split('.')[0];
    }

    // Extract from README first line
    if (readme) {
        const lines = readme.split('\n');
        for (const line of lines) {
            const cleaned = line.replace(/^#+\s*/, '').trim();
            if (cleaned && cleaned.length > 5 && cleaned.length < 100) {
                return cleaned;
            }
        }
    }

    // Convert repo name to title case
    return repoName
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Generate short blurb for portfolio card
 */
function generateShortBlurb(description, readme) {
    if (description) {
        return description.length > 120 ? description.substring(0, 120) + '...' : description;
    }

    const summary = extractReadmeSummary(readme);
    if (summary) {
        return summary.length > 120 ? summary.substring(0, 120) + '...' : summary;
    }

    return 'A project showcasing software development skills';
}

/**
 * Generate long blurb for project detail
 */
function generateLongBlurb(description, readme, language, topics) {
    let blurb = '';

    if (description) {
        blurb += description + '. ';
    } else if (readme) {
        const summary = extractReadmeSummary(readme);
        if (summary) {
            blurb += summary + '. ';
        }
    }

    if (language) {
        blurb += `Built with ${language}. `;
    }

    if (topics && topics.length > 0) {
        blurb += `Topics covered include ${topics.slice(0, 3).join(', ')}. `;
    }

    if (!blurb) {
        blurb = 'A software development project demonstrating technical skills and best practices. ';
    }

    // Try to extract more details from README
    if (readme && blurb.length < 200) {
        const lines = readme.split('\n')
            .filter(line => line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('!'))
            .map(line => line.trim());

        if (lines.length > 1) {
            blurb += lines[1].substring(0, 100);
        }
    }

    return blurb.trim();
}

/**
 * Score a repository based on criteria
 */
function scoreRepository(repoData) {
    let score = 0;
    const reasons = [];

    // Description present (+40)
    const hasDescription = repoData.description || repoData.readmeSummary;
    if (hasDescription) {
        score += 40;
        reasons.push('Has description');
    }

    // Logo found in repo root (+60)
    if (repoData.rootImage) {
        score += 60;
        reasons.push('Logo found in repo root');
    }

    // README image found (+20)
    if (repoData.readmeImage && !repoData.rootImage) {
        score += 20;
        reasons.push('README image found');
    }

    // Recent activity - last 12 months (+10)
    if (repoData.isRecent) {
        score += 10;
        reasons.push('Recent activity');
    }

    // Stars weight (+2 per star)
    const starsScore = repoData.stars * 2;
    score += starsScore;
    if (repoData.stars > 0) {
        reasons.push(`${repoData.stars} star${repoData.stars > 1 ? 's' : ''}`);
    }

    return {
        score,
        reasons: reasons.join(' · ')
    };
}

/**
 * Process a single repository
 */
async function processRepository(repo) {
    if (!JSON_ONLY) console.log(`Processing: ${repo.name}...`);

    const owner = repo.owner.login;
    const repoName = repo.name;
    const defaultBranch = repo.default_branch || 'main';

    // Fetch README and root files
    const [readme, rootFiles] = await Promise.all([
        fetchReadme(owner, repoName, defaultBranch),
        fetchRootFiles(owner, repoName, defaultBranch)
    ]);

    // Find images
    const rootImage = findRootImage(rootFiles, owner, repoName, defaultBranch);
    const readmeImageRaw = extractReadmeImage(readme);
    const readmeImage = resolveImageUrl(readmeImageRaw, owner, repoName, defaultBranch);

    // Choose best thumbnail (prefer root image)
    let chosenThumbnail = null;
    let chosenThumbnailSource = null;

    if (rootImage) {
        chosenThumbnail = rootImage;
        chosenThumbnailSource = 'root';
    } else if (readmeImage) {
        chosenThumbnail = readmeImage;
        chosenThumbnailSource = 'readme';
    }

    // Prepare repository data
    const repoData = {
        name: repoName,
        owner: owner,
        html_url: repo.html_url,
        default_branch: defaultBranch,
        primary_language: repo.language,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        last_push: repo.pushed_at,
        topics: repo.topics || [],
        description: repo.description,
        readme: readme,
        readmeSummary: extractReadmeSummary(readme),
        rootImage: rootImage,
        readmeImage: readmeImage,
        isRecent: isRecentActivity(repo.pushed_at)
    };

    // Score repository
    const { score, reasons } = scoreRepository(repoData);

    return {
        name: repoName,
        owner: owner,
        html_url: repo.html_url,
        default_branch: defaultBranch,
        primary_language: repo.language,
        stars: repoData.stars,
        forks: repoData.forks,
        last_push: repo.pushed_at,
        topics: repoData.topics,
        chosen_thumbnail_url: chosenThumbnail,
        chosen_thumbnail_source: chosenThumbnailSource,
        reason_for_selection: reasons,
        suggested_portfolio_title: generatePortfolioTitle(repoName, repo.description, readme),
        suggested_short_blurb: generateShortBlurb(repo.description, readme),
        suggested_long_blurb: generateLongBlurb(repo.description, readme, repo.language, repoData.topics),
        score: score
    };
}

/**
 * Main function
 */
async function main() {
    try {
        if (!JSON_ONLY) console.log('=== GitHub Repository Selector for Portfolio ===\n');

        // Fetch all repositories
        const repos = await fetchUserRepos(GITHUB_USER);

        if (repos.length === 0) {
            if (!JSON_ONLY) console.log('No repositories found.');
            return;
        }

        // Process all repositories
        if (!JSON_ONLY) console.log('\nProcessing repositories...\n');
        const processedRepos = [];

        for (const repo of repos) {
            try {
                const processed = await processRepository(repo);
                processedRepos.push(processed);
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                if (!JSON_ONLY) console.error(`Error processing ${repo.name}:`, error.message);
            }
        }

        // Sort by score (desc), then stars (desc), then last_push (desc)
        processedRepos.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (b.stars !== a.stars) {
                return b.stars - a.stars;
            }
            return new Date(b.last_push) - new Date(a.last_push);
        });

        // Select top 10
        const top10 = processedRepos.slice(0, 10);

        // Prepare output
        const output = {
            generated_at: new Date().toISOString(),
            count: top10.length,
            projects: top10
        };

        // Output JSON
        if (JSON_ONLY) {
            // Output only JSON to stdout
            console.log(JSON.stringify(output, null, 2));
        } else {
            // Write to file and show summary
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

            console.log('\n=== Results ===');
            console.log(`Processed: ${processedRepos.length} repositories`);
            console.log(`Selected: ${top10.length} repositories`);
            console.log(`Output file: ${OUTPUT_FILE}`);
            
            console.log('\nTop 10 Projects:');
            top10.forEach((project, index) => {
                console.log(`${index + 1}. ${project.name} (Score: ${project.score})`);
                console.log(`   ${project.reason_for_selection}`);
            });

            console.log('\n✅ Process completed successfully!');
        }
    } catch (error) {
        if (!JSON_ONLY) {
            console.error('Error:', error.message);
        } else {
            // In JSON-only mode, output error as JSON
            console.log(JSON.stringify({
                error: error.message,
                generated_at: new Date().toISOString()
            }, null, 2));
        }
        process.exit(1);
    }
}

// Run the script
main();
