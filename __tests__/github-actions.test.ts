import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('GitHub Actions Configuration', () => {
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  
  beforeAll(() => {
    // Ensure workflows directory exists
    expect(fs.existsSync(workflowsDir)).toBe(true);
  });

  test('CI workflow exists and is valid', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    expect(fs.existsSync(ciWorkflowPath)).toBe(true);
    
    const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
    const ciWorkflow = yaml.load(ciContent) as any;
    
    // Check basic structure
    expect(ciWorkflow.name).toBe('CI');
    expect(ciWorkflow.on).toBeDefined();
    expect(ciWorkflow.jobs).toBeDefined();
    
    // Check that it runs on push and pull_request
    expect(ciWorkflow.on.push).toBeDefined();
    expect(ciWorkflow.on.pull_request).toBeDefined();
    
    // Check that main branch is protected
    expect(ciWorkflow.on.push.branches).toContain('main');
    expect(ciWorkflow.on.pull_request.branches).toContain('main');
    
    // Check that test job exists
    expect(ciWorkflow.jobs.test).toBeDefined();
    expect(ciWorkflow.jobs.test.steps).toBeDefined();
    
    // Verify essential steps are present
    const testSteps = ciWorkflow.jobs.test.steps;
    const stepNames = testSteps.map((step: any) => step.name);
    
    expect(stepNames).toContain('Checkout code');
    expect(stepNames.some((name: string) => name.includes('Node.js'))).toBe(true);
    expect(stepNames).toContain('Install dependencies');
    expect(stepNames).toContain('Run linting');
    expect(stepNames).toContain('Run type checking');
    expect(stepNames).toContain('Run tests');
    expect(stepNames).toContain('Build application');
    expect(stepNames).toContain('Run security audit');
  });

  test('Branch protection workflow exists and is valid', () => {
    const branchProtectionPath = path.join(workflowsDir, 'branch-protection.yml');
    expect(fs.existsSync(branchProtectionPath)).toBe(true);
    
    const content = fs.readFileSync(branchProtectionPath, 'utf8');
    const workflow = yaml.load(content) as any;
    
    expect(workflow.name).toBe('Branch Protection');
    expect(workflow.on).toBeDefined();
    expect(workflow.jobs).toBeDefined();
    
    // Check that it has a scheduled run (weekly maintenance)
    expect(workflow.on.schedule).toBeDefined();
    expect(workflow.on.schedule[0].cron).toBeDefined();
    
    // Check that validation job exists
    expect(workflow.jobs['validate-protection']).toBeDefined();
  });

  test('Security audit is integrated into CI workflow', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
    const ciWorkflow = yaml.load(ciContent) as any;
    
    // Check that security audit step exists in CI workflow
    const testSteps = ciWorkflow.jobs.test.steps;
    const stepNames = testSteps.map((step: any) => step.name);
    
    expect(stepNames).toContain('Run security audit');
    
    // Verify the security audit step configuration
    const securityStep = testSteps.find((step: any) => step.name === 'Run security audit');
    expect(securityStep.run).toContain('npm audit');
    expect(securityStep['continue-on-error']).toBe(true);
  });

  test('Pull request template exists', () => {
    const prTemplatePath = path.join(process.cwd(), '.github', 'pull_request_template.md');
    expect(fs.existsSync(prTemplatePath)).toBe(true);
    
    const content = fs.readFileSync(prTemplatePath, 'utf8');
    expect(content).toContain('## Description');
    expect(content).toContain('## Type of Change');
    expect(content).toContain('## Testing');
    expect(content).toContain('## Checklist');
    expect(content).toContain('Fixes #');
  });

  test('Issue templates exist', () => {
    const issueTemplateDir = path.join(process.cwd(), '.github', 'ISSUE_TEMPLATE');
    expect(fs.existsSync(issueTemplateDir)).toBe(true);
    
    const bugReportPath = path.join(issueTemplateDir, 'bug_report.md');
    const featureRequestPath = path.join(issueTemplateDir, 'feature_request.md');
    
    expect(fs.existsSync(bugReportPath)).toBe(true);
    expect(fs.existsSync(featureRequestPath)).toBe(true);
    
    // Check bug report template content
    const bugContent = fs.readFileSync(bugReportPath, 'utf8');
    expect(bugContent).toContain('name: Bug report');
    expect(bugContent).toContain('labels: bug');
    
    // Check feature request template content
    const featureContent = fs.readFileSync(featureRequestPath, 'utf8');
    expect(featureContent).toContain('name: Feature request');
    expect(featureContent).toContain('labels: enhancement');
  });

  test('Workflows protect main branch effectively', () => {
    const ciWorkflowPath = path.join(workflowsDir, 'ci.yml');
    const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
    const ciWorkflow = yaml.load(ciContent) as any;
    
    // Ensure CI runs on pull requests to main
    expect(ciWorkflow.on.pull_request.branches).toContain('main');
    
    // Ensure all critical checks are present
    const testJob = ciWorkflow.jobs.test;
    const stepCommands = testJob.steps
      .filter((step: any) => step.run)
      .map((step: any) => step.run);
    
    expect(stepCommands.some((cmd: string) => cmd.includes('npm run lint'))).toBe(true);
    expect(stepCommands.some((cmd: string) => cmd.includes('npm run type-check'))).toBe(true);
    expect(stepCommands.some((cmd: string) => cmd.includes('npm test'))).toBe(true);
    expect(stepCommands.some((cmd: string) => cmd.includes('npm run build'))).toBe(true);
  });
});