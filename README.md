# OpenHands Repository Boilerplate

A comprehensive boilerplate repository for greenfield projects using OpenHands, complete with best practices, validation tools, and project templates.

## Description

This repository provides a complete foundation for starting new projects with OpenHands. It includes:

- **Comprehensive best practices documentation** for code quality, version control, and project structure
- **Automated validation tools** to ensure adherence to best practices
- **Project templates** with essential files and directory structure
- **Testing frameworks** for validating project compliance
- **Continuous integration** support for maintaining quality standards

## Features

- 📋 **Best Practices Guide**: Detailed documentation covering all aspects of OpenHands development
- 🔍 **Automated Validation**: Scripts to check project structure, code quality, and compliance
- 🧪 **Test Suite**: Comprehensive tests for validating best practices adherence
- 📁 **Project Templates**: Ready-to-use directory structure and configuration files
- 🚀 **CI/CD Ready**: Integration scripts for continuous compliance checking

## Installation

### Prerequisites

- Python 3.8 or higher
- Git
- OpenHands environment

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/jamiechicago312/openhands-repo-boiler-plate.git
   cd openhands-repo-boiler-plate
   ```

2. Install dependencies (if using Python):
   ```bash
   pip install -r requirements.txt
   ```

3. Make validation scripts executable:
   ```bash
   chmod +x scripts/validate_best_practices.py
   ```

## Usage

### Using as a Template

1. **Copy the structure** to your new project:
   ```bash
   cp -r openhands-repo-boiler-plate/ your-new-project/
   cd your-new-project/
   ```

2. **Initialize your project**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with OpenHands boilerplate"
   ```

3. **Customize for your project**:
   - Update `README.md` with your project details
   - Modify `.gitignore` for your technology stack
   - Add your source code to the `src/` directory
   - Update `CHANGELOG.md` with your version history

### Validating Best Practices

Run the validation script to check compliance:

```bash
# Basic validation
python scripts/validate_best_practices.py

# Verbose output
python scripts/validate_best_practices.py --verbose

# JSON output for CI/CD
python scripts/validate_best_practices.py --output-format json

# Fail on errors (useful for CI/CD)
python scripts/validate_best_practices.py --fail-on-error
```

### Running Tests

Execute the test suite to validate your project:

```bash
# Run all best practices tests
python -m pytest tests/test_best_practices.py -v

# Run specific test
python -m pytest tests/test_best_practices.py::OpenHandsBestPracticesTest::test_project_structure_exists -v
```

## Project Structure

```
openhands-repo-boiler-plate/
├── README.md                          # This file
├── CHANGELOG.md                       # Version history
├── LICENSE                           # Project license
├── .gitignore                        # Git ignore patterns
├── requirements.txt                  # Python dependencies
├── OPENHANDS_BEST_PRACTICES.md      # Comprehensive best practices guide
├── src/                             # Source code directory
├── tests/                           # Test files
│   └── test_best_practices.py       # Best practices validation tests
├── scripts/                         # Utility scripts
│   └── validate_best_practices.py   # Validation script
├── docs/                            # Documentation
└── config/                          # Configuration files
```

## Best Practices

This repository follows and enforces OpenHands best practices:

### Code Quality
- Clean, readable code with minimal redundant comments
- Consistent naming conventions
- Single responsibility principle
- Proper error handling

### Version Control
- Meaningful commit messages with co-authorship
- No sensitive files in version control
- Proper branch management
- Clean git history

### File Management
- No duplicate file versions with suffixes
- Consistent directory structure
- Proper file naming conventions
- Organized project layout

### Testing
- Comprehensive test coverage for functionality
- Automated validation of best practices
- Continuous integration support
- Test-driven development approach

For detailed guidelines, see [OPENHANDS_BEST_PRACTICES.md](OPENHANDS_BEST_PRACTICES.md).

## Validation Checks

The automated validation includes:

- ✅ **Required Files**: README.md, .gitignore, CHANGELOG.md
- ✅ **README Quality**: Essential sections and content
- ✅ **Git Configuration**: Proper setup and user configuration
- ✅ **File Naming**: Consistent naming conventions
- ✅ **No Duplicates**: No version suffixes on files
- ✅ **Security**: No sensitive files tracked
- ✅ **Clean Repository**: No build artifacts tracked
- ✅ **Project Structure**: Recommended directory organization
- ✅ **Dependencies**: Proper dependency management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the best practices
4. Run validation: `python scripts/validate_best_practices.py`
5. Run tests: `python -m pytest tests/ -v`
6. Commit your changes: `git commit -am 'Add your feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

### Development Guidelines

- Follow the established best practices
- Add tests for new validation rules
- Update documentation for new features
- Ensure all validation checks pass
- Include meaningful commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 **Documentation**: See [OPENHANDS_BEST_PRACTICES.md](OPENHANDS_BEST_PRACTICES.md)
- 🐛 **Issues**: Report bugs and request features via GitHub Issues
- 💬 **Discussions**: Join project discussions for questions and ideas

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and versions.

---

**Note**: This boilerplate is designed to evolve with OpenHands best practices. Regular updates ensure it remains current with the latest recommendations and standards.