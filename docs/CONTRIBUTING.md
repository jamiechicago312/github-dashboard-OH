# Contributing to OpenHands Repository Boilerplate

Thank you for your interest in contributing to the OpenHands Repository Boilerplate! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contributing Guidelines](#contributing-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Release Process](#release-process)

## Code of Conduct

This project follows the OpenHands community standards. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Git
- Basic understanding of OpenHands best practices

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/openhands-repo-boiler-plate.git
   cd openhands-repo-boiler-plate
   ```

## Development Setup

1. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Install pre-commit hooks** (optional but recommended):
   ```bash
   pip install pre-commit
   pre-commit install
   ```

4. **Run initial validation**:
   ```bash
   python scripts/validate_best_practices.py
   python -m pytest tests/ -v
   ```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug fixes**: Fix issues in validation logic or documentation
- **Feature enhancements**: Add new validation rules or improve existing ones
- **Documentation**: Improve guides, examples, or API documentation
- **Testing**: Add or improve test coverage
- **Examples**: Provide additional project templates or use cases

### Coding Standards

Follow these standards for all contributions:

1. **Code Quality**:
   - Write clean, readable code with minimal comments
   - Follow PEP 8 for Python code
   - Use meaningful variable and function names
   - Keep functions focused and small

2. **Documentation**:
   - Document all public functions and classes
   - Update README.md for significant changes
   - Include examples in docstrings where helpful

3. **Testing**:
   - Add tests for new functionality
   - Ensure all existing tests pass
   - Aim for good test coverage

4. **Git Practices**:
   - Use descriptive commit messages
   - Include co-authorship: `Co-authored-by: openhands <openhands@all-hands.dev>`
   - Keep commits focused and atomic
   - Rebase feature branches before submitting PRs

### Commit Message Format

Use this format for commit messages:

```
type(scope): description

Detailed explanation if needed

Co-authored-by: openhands <openhands@all-hands.dev>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Maintenance tasks

Examples:
```
feat(validation): add check for dependency file versions

Add validation rule to ensure dependency files specify
version constraints for security and reproducibility.

Co-authored-by: openhands <openhands@all-hands.dev>
```

## Pull Request Process

### Before Submitting

1. **Run all checks**:
   ```bash
   ./scripts/run_tests.sh
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Update CHANGELOG.md** with your changes

### Submitting the PR

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines above

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): your change description

   Co-authored-by: openhands <openhands@all-hands.dev>"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

### PR Requirements

Your PR should:
- [ ] Have a clear title and description
- [ ] Reference any related issues
- [ ] Include tests for new functionality
- [ ] Pass all existing tests
- [ ] Follow coding standards
- [ ] Update documentation if needed
- [ ] Include appropriate changelog entries

### Review Process

1. **Automated checks** will run on your PR
2. **Maintainers will review** your code
3. **Address feedback** by pushing new commits
4. **Squash and merge** once approved

## Testing

### Running Tests

```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_best_practices.py -v

# Run with coverage
python -m pytest tests/ --cov=src --cov-report=html
```

### Test Structure

- `tests/test_best_practices.py`: Main validation tests
- Add new test files as needed for new features
- Use descriptive test names
- Include both positive and negative test cases

### Writing Tests

```python
def test_new_validation_rule(self):
    """Test that new validation rule works correctly."""
    # Arrange
    test_project = self.create_test_project()
    
    # Act
    result = validate_rule(test_project)
    
    # Assert
    self.assertTrue(result.is_valid)
    self.assertEqual(result.message, "Expected message")
```

## Documentation

### Types of Documentation

1. **Code Documentation**: Docstrings for functions and classes
2. **User Documentation**: README.md and guides
3. **API Documentation**: Generated from docstrings
4. **Examples**: Sample projects and use cases

### Documentation Standards

- Use clear, concise language
- Include examples where helpful
- Keep documentation up-to-date with code changes
- Use proper Markdown formatting

### Building Documentation

```bash
# Install documentation dependencies
pip install sphinx sphinx-rtd-theme

# Build documentation
cd docs
make html
```

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Steps

1. **Update version numbers** in relevant files
2. **Update CHANGELOG.md** with release notes
3. **Create release PR** and get approval
4. **Tag the release** after merging
5. **Create GitHub release** with release notes

## Getting Help

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check existing documentation first

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- GitHub contributors list
- Release notes for significant contributions

Thank you for contributing to the OpenHands Repository Boilerplate! Your contributions help make OpenHands development more efficient and consistent for everyone.