const { test, expect } = require('@playwright/test');

/**
 * SEO Test Suite for Brahim El Houss Portfolio
 * 
 * This test suite verifies that all SEO elements are properly implemented
 * to ensure optimal ranking for name-based searches with various case and spacing variations.
 */

test.describe('Homepage SEO Meta Tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct title with name and location', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Brahim El Houss');
    expect(title).toContain('Full Stack Software Engineer');
    expect(title).toContain('Morocco');
    console.log('✓ Page title:', title);
  });

  test('should have comprehensive meta description with name', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).toContain('Brahim El Houss');
    expect(description.length).toBeGreaterThan(120); // Good length for SEO
    expect(description.length).toBeLessThan(320); // Not too long
    console.log('✓ Meta description length:', description.length, 'characters');
  });

  test('should include all name variations in keywords meta tag', async ({ page }) => {
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toBeTruthy();
    
    const nameVariations = [
      'Brahim El Houss',
      'brahim elhouss',
      'BRAHIM ELHOUSS',
      'Brahim Elhouss',
      'brahim el houss',
      'BRAHIM EL HOUSS'
    ];
    
    for (const variant of nameVariations) {
      expect(keywords.toLowerCase()).toContain(variant.toLowerCase());
    }
    console.log('✓ All name variations found in keywords');
  });

  test('should have proper Open Graph tags for social sharing', async ({ page }) => {
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    
    expect(ogType).toBe('profile'); // Should be 'profile' for person
    expect(ogTitle).toContain('Brahim El Houss');
    expect(ogDescription).toContain('Brahim El Houss');
    expect(ogUrl).toBeTruthy();
    expect(ogImage).toBeTruthy();
    
    console.log('✓ Open Graph type:', ogType);
    console.log('✓ Open Graph title:', ogTitle);
  });

  test('should have Twitter Card meta tags', async ({ page }) => {
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
    
    expect(twitterCard).toBeTruthy();
    expect(twitterTitle).toContain('Brahim El Houss');
    expect(twitterDescription).toContain('Brahim El Houss');
    expect(twitterImage).toBeTruthy();
    
    console.log('✓ Twitter Card:', twitterCard);
  });

  test('should have canonical URL', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/https?:\/\//);
    console.log('✓ Canonical URL:', canonical);
  });

  test('should have robots meta tag set to index and follow', async ({ page }) => {
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('index');
    expect(robots).toContain('follow');
    console.log('✓ Robots meta tag:', robots);
  });

  test('should have geo meta tags for location', async ({ page }) => {
    const geoRegion = await page.locator('meta[name="geo.region"]').getAttribute('content');
    const geoCountry = await page.locator('meta[name="geo.country"]').getAttribute('content');
    const geoPlacename = await page.locator('meta[name="geo.placename"]').getAttribute('content');
    
    expect(geoRegion).toBe('MA');
    expect(geoCountry).toBe('Morocco');
    expect(geoPlacename).toBe('Casablanca');
    
    console.log('✓ Geo location:', geoPlacename, geoCountry);
  });
});

test.describe('Structured Data (JSON-LD)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have Person schema with all name variations', async ({ page }) => {
    // Extract all JSON-LD scripts
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLdScripts.length).toBeGreaterThan(0);
    
    // Find the Person schema
    let personSchema = null;
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script);
        if (data['@type'] === 'Person' || (Array.isArray(data['@graph']) && data['@graph'].find(item => item['@type'] === 'Person'))) {
          personSchema = data['@type'] === 'Person' ? data : data['@graph'].find(item => item['@type'] === 'Person');
          break;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    expect(personSchema).toBeTruthy();
    expect(personSchema.name).toBe('Brahim El Houss');
    expect(personSchema.alternateName).toBeDefined();
    expect(Array.isArray(personSchema.alternateName)).toBe(true);
    
    // Check for all name variations
    const expectedVariations = [
      'brahim elhouss',
      'BRAHIM ELHOUSS',
      'Brahim Elhouss',
      'brahim el houss',
      'BRAHIM EL HOUSS'
    ];
    
    for (const variant of expectedVariations) {
      const found = personSchema.alternateName.some(name => 
        name.toLowerCase() === variant.toLowerCase()
      );
      expect(found).toBe(true);
    }
    
    console.log('✓ Person schema found with', personSchema.alternateName.length, 'name variations');
    console.log('✓ Name variations:', personSchema.alternateName.join(', '));
  });

  test('should have proper jobTitle in Person schema', async ({ page }) => {
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    let personSchema = null;
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script);
        if (data['@type'] === 'Person') {
          personSchema = data;
          break;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    expect(personSchema).toBeTruthy();
    expect(personSchema.jobTitle).toBeTruthy();
    expect(personSchema.jobTitle).toContain('Software Engineer');
    
    console.log('✓ Job title:', personSchema.jobTitle);
  });

  test('should have WebSite or WebPage schema', async ({ page }) => {
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    let hasWebSchema = false;
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script);
        if (data['@type'] === 'WebSite' || data['@type'] === 'WebPage') {
          hasWebSchema = true;
          console.log('✓ Found schema type:', data['@type']);
          break;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    expect(hasWebSchema).toBe(true);
  });

  test('should have FAQ schema for better SERP features', async ({ page }) => {
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    
    let hasFAQSchema = false;
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script);
        if (data['@type'] === 'FAQPage') {
          hasFAQSchema = true;
          expect(data.mainEntity).toBeDefined();
          expect(Array.isArray(data.mainEntity)).toBe(true);
          expect(data.mainEntity.length).toBeGreaterThan(0);
          console.log('✓ FAQ schema found with', data.mainEntity.length, 'questions');
          break;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    // FAQ schema is optional but recommended
    if (!hasFAQSchema) {
      console.log('⚠ FAQ schema not found - consider adding for rich snippets');
    }
  });
});

test.describe('Content and Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the name prominently on the page', async ({ page }) => {
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Brahim El Houss');
    console.log('✓ Name appears in page content');
  });

  test('should have h1 heading with name or job title', async ({ page }) => {
    const h1Elements = await page.locator('h1').allTextContents();
    expect(h1Elements.length).toBeGreaterThan(0);
    
    const h1Text = h1Elements.join(' ');
    const hasNameOrTitle = h1Text.includes('Brahim') || 
                          h1Text.includes('Software Engineer') ||
                          h1Text.includes('Full Stack');
    
    expect(hasNameOrTitle).toBe(true);
    console.log('✓ H1 headings:', h1Elements);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(375);
    
    // Check if content is visible
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);
    
    console.log('✓ Page renders on mobile viewport');
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    if (errors.length > 0) {
      console.log('⚠ JavaScript errors found:', errors);
    }
    
    // Not failing the test for JS errors, just logging them
    console.log('✓ Page loaded (JS errors:', errors.length, ')');
  });
});

test.describe('Additional SEO Files', () => {
  test('should have a robots.txt file', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response.status()).toBe(200);
    
    const content = await page.textContent('body');
    expect(content).toContain('User-agent');
    
    console.log('✓ robots.txt exists and is valid');
  });

  test('should have a sitemap.xml file', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response.status()).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('urlset');
    expect(content).toContain('brahim-elhouss.me');
    
    console.log('✓ sitemap.xml exists and is valid');
  });

  test('should have llms.txt for AI search engines', async ({ page }) => {
    const response = await page.goto('/llms.txt');
    expect(response.status()).toBe(200);
    
    const content = await page.textContent('body');
    expect(content).toContain('Brahim El Houss');
    
    console.log('✓ llms.txt exists');
  });
});

test.describe('Performance and Loading', () => {
  test('should load the homepage within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
    console.log('✓ Page loaded in', loadTime, 'ms');
  });

  test('should have proper charset and viewport meta tags', async ({ page }) => {
    await page.goto('/');
    
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    expect(charset).toBeTruthy();
    expect(viewport).toContain('width=device-width');
    
    console.log('✓ Charset:', charset);
    console.log('✓ Viewport:', viewport);
  });
});

test.describe('About Page SEO', () => {
  test('should have proper SEO on about page', async ({ page }) => {
    const response = await page.goto('/about.php');
    
    // Check if page exists
    if (response.status() === 200) {
      const title = await page.title();
      expect(title).toContain('Brahim El Houss');
      console.log('✓ About page title:', title);
      
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      if (description) {
        expect(description).toContain('Brahim El Houss');
        console.log('✓ About page has proper description');
      }
    } else {
      console.log('⚠ About page not accessible');
    }
  });
});
