# GitHub Projects Selector

This script automatically selects the best public GitHub repositories for portfolio display.

## Overview

The script fetches all public repositories for a GitHub user, analyzes them based on various criteria, scores them, and selects the top 10 repositories suitable for portfolio display.

## Features

- ✅ Fetches all public repositories from GitHub
- ✅ Analyzes repository metadata (stars, forks, language, topics)
- ✅ Detects and selects best thumbnail images from repo root and README
- ✅ Scores repositories based on multiple criteria
- ✅ Generates portfolio-ready titles and descriptions
- ✅ Outputs structured JSON data

## Scoring Algorithm

Repositories are scored based on the following criteria:

| Criterion | Points | Description |
|-----------|--------|-------------|
| Description | +40 | Repository has a description or README summary |
| Logo in root | +60 | Logo/icon image found in repository root |
| README image | +20 | Image found in README (if no root logo) |
| Recent activity | +10 | Repository updated within last 12 months |
| Stars | +2 each | GitHub stars count (weight: 2 points per star) |

**Tiebreaker**: When scores are equal, repositories are sorted by stars count (desc), then by last push date (desc).

## Image Detection

The script intelligently detects thumbnail images:

1. **Root files**: Searches for image files (svg, png, jpg, jpeg, gif) in repository root
2. **Preference order**: logo* > icon* > screenshot* > first image found
3. **Type preference**: svg > png > jpg/jpeg > gif
4. **README images**: Extracts first Markdown image `![alt](url)` if no root image
5. **URL resolution**: Converts relative paths to raw.githubusercontent.com URLs

## Usage

### Basic Usage

```bash
node scripts/select-github-projects.js
```

This will:
- Fetch and analyze all public repositories
- Generate output file at `data/selected-github-projects.json`
- Display summary with top 10 projects

### JSON-Only Output

```bash
node scripts/select-github-projects.js --json-only
```

Returns only JSON output (no commentary) - suitable for automation and integration.

### With GitHub Token (Recommended)

To avoid GitHub API rate limits, use a personal access token:

```bash
export GITHUB_TOKEN="your_token_here"
node scripts/select-github-projects.js
```

Or:

```bash
GITHUB_TOKEN="your_token_here" node scripts/select-github-projects.js
```

**Note**: The script also accepts `GH_TOKEN` environment variable.

## Output Format

The script generates JSON with the following structure:

```json
{
  "generated_at": "2024-11-13T08:20:00.000Z",
  "count": 10,
  "projects": [
    {
      "name": "repository-name",
      "owner": "EL-HOUSS-BRAHIM",
      "html_url": "https://github.com/EL-HOUSS-BRAHIM/repository-name",
      "default_branch": "main",
      "primary_language": "JavaScript",
      "stars": 5,
      "forks": 2,
      "last_push": "2024-11-01T10:30:00Z",
      "topics": ["javascript", "web-development"],
      "chosen_thumbnail_url": "https://raw.githubusercontent.com/EL-HOUSS-BRAHIM/repository-name/main/logo.png",
      "chosen_thumbnail_source": "root",
      "reason_for_selection": "Has description · Logo found in repo root · 5 stars · Recent activity",
      "suggested_portfolio_title": "Repository Name",
      "suggested_short_blurb": "A brief description suitable for portfolio cards",
      "suggested_long_blurb": "A detailed 3-4 sentence description explaining the project purpose, technologies used, and key features.",
      "score": 120
    }
  ]
}
```

## Field Descriptions

- `generated_at`: ISO-8601 timestamp when the data was generated
- `count`: Number of projects selected (max 10)
- `projects`: Array of top 10 repositories sorted by score

### Project Fields

- `name`: Repository name
- `owner`: GitHub username
- `html_url`: Repository URL
- `default_branch`: Default branch name (usually "main" or "master")
- `primary_language`: Primary programming language
- `stars`: Number of GitHub stars
- `forks`: Number of forks
- `last_push`: ISO-8601 timestamp of last push
- `topics`: Array of repository topics/tags
- `chosen_thumbnail_url`: Direct URL to thumbnail image (or null)
- `chosen_thumbnail_source`: Image source: "root", "readme", or null
- `reason_for_selection`: Human-readable scoring breakdown
- `suggested_portfolio_title`: Generated title for portfolio display
- `suggested_short_blurb`: One-line description for cards
- `suggested_long_blurb`: Detailed description (3-4 sentences)
- `score`: Numeric score used for ranking

## GitHub API Rate Limits

- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

The script includes a 500ms delay between repository processing to respect rate limits.

## Configuration

Edit the script constants at the top to customize:

```javascript
const GITHUB_USER = 'EL-HOUSS-BRAHIM';  // GitHub username
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'selected-github-projects.json');
const IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
const IMAGE_PREFERENCE_NAMES = ['logo', 'icon', 'screenshot'];
```

## Troubleshooting

### Rate Limit Errors

If you encounter rate limit errors:
1. Use a GitHub personal access token (see "With GitHub Token" above)
2. Wait for rate limit reset (shown in error message)
3. Reduce request frequency by increasing delay in script

### No Repositories Found

- Verify the GitHub username is correct
- Check that the user has public repositories
- Ensure network connectivity to api.github.com

### Image URLs Not Working

- Images are resolved to raw.githubusercontent.com URLs
- Verify the repository and branch names are correct
- Check that image files exist in the repository

## Dependencies

- Node.js (built-in modules only: https, fs, path)
- No external npm packages required

## License

Part of the portfolio project. See main repository LICENSE.
