/**
 * Style Reversion Test
 * 
 * This test verifies that the style reversion to commit 6043a39 was successful.
 * It checks key styling elements that were changed in the reversion.
 */

const fs = require('fs');
const path = require('path');

describe('Style Reversion to commit 6043a39', () => {
  const projectRoot = path.resolve(__dirname, '..');

  test('layout.tsx should use both Inter and Poppins fonts', () => {
    const layoutPath = path.join(projectRoot, 'app', 'layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    
    // Should import both fonts
    expect(content).toMatch(/import.*Inter.*Poppins.*from 'next\/font\/google'/);
    
    // Should define both font variables
    expect(content).toMatch(/const inter = Inter\(\{ subsets: \['latin'\], variable: '--font-inter' \}\)/);
    expect(content).toMatch(/const poppins = Poppins\(/);
    expect(content).toMatch(/variable: '--font-poppins'/);
    
    // Should use both variables in body className
    expect(content).toMatch(/className=\{`\$\{inter\.variable\} \$\{poppins\.variable\} font-sans`\}/);
  });

  test('globals.css should include font family configurations', () => {
    const cssPath = path.join(projectRoot, 'app', 'globals.css');
    const content = fs.readFileSync(cssPath, 'utf8');
    
    // Should have Inter font family for body
    expect(content).toMatch(/font-family: var\(--font-inter\), system-ui, sans-serif;/);
    
    // Should have Poppins font configurations for headings
    expect(content).toMatch(/h1, h2, h3, h4, h5, h6, \.font-heading/);
    expect(content).toMatch(/font-family: var\(--font-poppins\), system-ui, sans-serif;/);
    expect(content).toMatch(/\.font-brand/);
  });

  test('header.tsx should include purple emoji and font-brand class', () => {
    const headerPath = path.join(projectRoot, 'components', 'header.tsx');
    const content = fs.readFileSync(headerPath, 'utf8');
    
    // Should have purple emoji
    expect(content).toMatch(/🙌/);
    
    // Should use font-brand class
    expect(content).toMatch(/font-brand/);
    
    // Should have the proper structure with emoji and logo
    expect(content).toMatch(/<div className="flex items-center space-x-1">/);
  });

  test('simple-countdown.tsx should use simple span styling', () => {
    const countdownPath = path.join(projectRoot, 'components', 'simple-countdown.tsx');
    const content = fs.readFileSync(countdownPath, 'utf8');
    
    // Should use simple span instead of styled div
    expect(content).toMatch(/<span className="text-xs text-muted-foreground font-mono">/);
    
    // Should NOT have the styled box classes
    expect(content).not.toMatch(/bg-secondary text-secondary-foreground rounded-md border/);
    expect(content).not.toMatch(/hover:shadow-md hover:bg-secondary\/80/);
  });

  test('components should use font-heading class for headings', () => {
    const componentsToCheck = [
      'components/activity-chart.tsx',
      'components/contributor-stats.tsx',
      'components/dashboard-overview.tsx',
      'components/repository-metrics.tsx'
    ];

    componentsToCheck.forEach(componentPath => {
      const fullPath = path.join(projectRoot, componentPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Should have font-heading class in h3 elements
        expect(content).toMatch(/font-heading/);
      }
    });
  });

  test('all modified files exist and are readable', () => {
    const filesToCheck = [
      'app/globals.css',
      'app/layout.tsx',
      'components/activity-chart.tsx',
      'components/contributor-stats.tsx',
      'components/dashboard-overview.tsx',
      'components/header.tsx',
      'components/repository-metrics.tsx',
      'components/simple-countdown.tsx'
    ];

    filesToCheck.forEach(filePath => {
      const fullPath = path.join(projectRoot, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(() => fs.readFileSync(fullPath, 'utf8')).not.toThrow();
    });
  });
});