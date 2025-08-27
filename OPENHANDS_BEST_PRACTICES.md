# OpenHands Best Practices for Greenfield Projects

This document outlines comprehensive best practices for using OpenHands effectively in greenfield (new) projects. Following these guidelines will ensure consistent, maintainable, and high-quality development workflows.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Code Quality Standards](#code-quality-standards)
3. [Version Control Guidelines](#version-control-guidelines)
4. [File System Management](#file-system-management)
5. [Testing Practices](#testing-practices)
6. [Documentation Standards](#documentation-standards)
7. [Security Considerations](#security-considerations)
8. [Environment Setup](#environment-setup)
9. [Task Management](#task-management)
10. [Troubleshooting Guidelines](#troubleshooting-guidelines)

## Project Setup

### Initial Repository Structure

Every greenfield project should follow this basic structure:

```
project-root/
├── .gitignore
├── README.md
├── CHANGELOG.md
├── LICENSE
├── requirements.txt (Python) / package.json (Node.js) / etc.
├── src/
│   └── main application code
├── tests/
│   └── test files
├── docs/
│   └── documentation files
├── scripts/
│   └── utility scripts
└── config/
    └── configuration files
```

### Essential Files

1. **README.md**: Must include:
   - Project description and purpose
   - Installation instructions
   - Usage examples
   - Contributing guidelines
   - License information

2. **.gitignore**: Include appropriate patterns for your technology stack
3. **LICENSE**: Choose and include appropriate license
4. **CHANGELOG.md**: Track version changes and updates

### Configuration Management

- Use environment-specific configuration files
- Never commit sensitive information (API keys, passwords)
- Use `.env.example` files to document required environment variables
- Implement configuration validation

## Code Quality Standards

### General Principles

1. **Clarity over Cleverness**: Write code that is easy to understand
2. **Minimal Comments**: Avoid redundant comments that repeat what code does
3. **Single Responsibility**: Each function/class should have one clear purpose
4. **DRY Principle**: Don't Repeat Yourself - extract common functionality

### Code Organization

- Place all imports at the top of files (unless specific reasons require otherwise)
- Group related functionality into modules/packages
- Use consistent naming conventions throughout the project
- Implement proper error handling and logging

### File Management Rules

**CRITICAL**: Never create multiple versions of the same file with different suffixes:
- ❌ `file_test.py`, `file_fix.py`, `file_simple.py`
- ✅ Modify the original file directly
- ✅ Use version control for history tracking

### Code Review Standards

- All code changes should be reviewable
- Include meaningful commit messages
- Test changes before committing
- Document breaking changes

## Version Control Guidelines

### Git Configuration

```bash
# Set up proper git identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# For OpenHands commits, include co-authorship
git config --global commit.template .gitmessage
```

### Commit Message Standards

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

Example:
```
feat(auth): add user authentication system

- Implement JWT-based authentication
- Add login/logout endpoints
- Include password hashing

Co-authored-by: openhands <openhands@all-hands.dev>
```

### Branch Management

- Use descriptive branch names: `feature/user-auth`, `fix/login-bug`
- Keep branches focused on single features/fixes
- Delete merged branches to keep repository clean
- Never push directly to main unless explicitly required

### Files to Exclude from Version Control

Never commit:
- `node_modules/`, `__pycache__/`, `.venv/`
- `.env` files with secrets
- Build artifacts and compiled files
- IDE-specific files (unless team-wide)
- Large binary files (use Git LFS if needed)
- Temporary files and logs

## File System Management

### Directory Organization

- Use clear, descriptive directory names
- Group related files together
- Maintain consistent structure across projects
- Document any non-standard directory purposes

### File Naming Conventions

- Use lowercase with hyphens for directories: `user-management/`
- Use descriptive names: `user-authentication.js` not `auth.js`
- Include file extensions appropriately
- Avoid special characters and spaces

### Path Management

- Always use absolute paths when possible
- Verify parent directories exist before creating files
- Use forward slashes for cross-platform compatibility
- Document any platform-specific path requirements

## Testing Practices

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
├── fixtures/      # Test data
└── utils/         # Test utilities
```

### Testing Guidelines

1. **Write Tests for Functionality**: Focus on business logic and features
2. **Skip Tests for Documentation**: Don't test README updates, config files
3. **Test-Driven Development**: Consider writing tests before implementation
4. **Edge Cases**: Include boundary conditions and error scenarios
5. **Test Environment**: Ensure tests can run in isolation

### When NOT to Write Tests

- Documentation changes
- README updates
- Configuration file modifications
- Simple formatting changes
- When extensive setup would be required without clear benefit

### Test Naming

- Use descriptive test names: `test_user_login_with_valid_credentials`
- Group related tests in classes/describe blocks
- Include both positive and negative test cases

## Documentation Standards

### Code Documentation

- Document complex algorithms and business logic
- Explain "why" not "what" in comments
- Keep documentation close to the code it describes
- Update documentation when code changes

### API Documentation

- Document all public APIs
- Include request/response examples
- Specify error conditions and codes
- Provide usage examples

### Project Documentation

- Maintain up-to-date README
- Document setup and deployment procedures
- Include troubleshooting guides
- Provide contribution guidelines

## Security Considerations

### Credential Management

- Never commit secrets to version control
- Use environment variables for sensitive data
- Implement proper secret rotation
- Use secure credential storage solutions

### Code Security

- Validate all inputs
- Implement proper authentication and authorization
- Use HTTPS for all external communications
- Keep dependencies updated

### Access Control

- Limit repository access appropriately
- Use branch protection rules
- Implement code review requirements
- Monitor for security vulnerabilities

## Environment Setup

### Dependency Management

1. **Use Dependency Files**: `requirements.txt`, `package.json`, `Gemfile`
2. **Version Pinning**: Specify exact versions for reproducible builds
3. **Development vs Production**: Separate dev and prod dependencies
4. **Regular Updates**: Keep dependencies current and secure

### Virtual Environments

- Always use virtual environments for isolation
- Document environment setup procedures
- Include environment activation in setup scripts
- Test in clean environments regularly

### Development Tools

- Use consistent code formatters (Prettier, Black, etc.)
- Implement linting rules
- Set up pre-commit hooks
- Configure IDE settings consistently

## Task Management

### Planning and Organization

- Break complex tasks into smaller, manageable pieces
- Use clear, actionable task descriptions
- Track progress systematically
- Update task status promptly

### Task Lifecycle

1. **Planning**: Define clear objectives and acceptance criteria
2. **Implementation**: Focus on one task at a time
3. **Testing**: Verify functionality before marking complete
4. **Documentation**: Update relevant documentation
5. **Review**: Ensure quality standards are met

### Progress Tracking

- Update task status regularly
- Communicate blockers and dependencies
- Document decisions and rationale
- Maintain visibility into project status

## Troubleshooting Guidelines

### Problem-Solving Approach

1. **Understand the Problem**: Gather complete information
2. **Reproduce the Issue**: Create minimal reproduction cases
3. **Analyze Root Causes**: Consider multiple potential sources
4. **Implement Solutions**: Make minimal, focused changes
5. **Verify Fixes**: Test thoroughly before considering complete

### Debugging Best Practices

- Use systematic debugging approaches
- Document findings and solutions
- Share knowledge with team members
- Create tests to prevent regression

### When to Seek Help

- After exhausting reasonable troubleshooting attempts
- When facing unfamiliar technologies or domains
- For security-related concerns
- When time constraints require escalation

## Process Management

### Service Management

- Use specific process identifiers when terminating services
- Avoid broad kill commands that might affect other processes
- Document service dependencies and startup procedures
- Implement graceful shutdown procedures

### Resource Management

- Monitor resource usage during development
- Clean up temporary files and processes
- Implement proper error handling and cleanup
- Document resource requirements

## Validation and Compliance

### Automated Checks

Implement automated validation for:
- Code quality standards
- Security vulnerabilities
- Dependency updates
- Documentation completeness
- Test coverage

### Regular Reviews

- Conduct periodic code reviews
- Audit security practices
- Review and update documentation
- Assess and improve processes

### Continuous Improvement

- Gather feedback on practices and processes
- Update guidelines based on lessons learned
- Share knowledge and best practices
- Invest in tooling and automation

## Conclusion

Following these best practices will help ensure that your greenfield projects built with OpenHands are maintainable, secure, and of high quality. Remember that these are guidelines to be adapted based on specific project needs and team preferences.

Regular review and updates of these practices will help maintain their relevance and effectiveness as projects and technologies evolve.

---

*This document should be reviewed and updated regularly to reflect evolving best practices and lessons learned from project experience.*