#!/usr/bin/env python3
"""
Project Setup Script for OpenHands Boilerplate

This script helps initialize a new project using the OpenHands boilerplate
by customizing templates and setting up the development environment.
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from typing import Dict, Any
import subprocess


class ProjectSetup:
    """Setup utility for new OpenHands projects."""
    
    def __init__(self, project_name: str, target_dir: str = None):
        self.project_name = project_name
        self.target_dir = Path(target_dir) if target_dir else Path.cwd() / project_name
        self.boilerplate_dir = Path(__file__).parent.parent
    
    def create_project(self) -> bool:
        """Create a new project from the boilerplate."""
        try:
            print(f"Creating new OpenHands project: {self.project_name}")
            print(f"Target directory: {self.target_dir}")
            
            # Create target directory
            self.target_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy boilerplate files
            self._copy_boilerplate_files()
            
            # Customize templates
            self._customize_templates()
            
            # Initialize git repository
            self._initialize_git()
            
            # Set up development environment
            self._setup_development_environment()
            
            print(f"\n✅ Project '{self.project_name}' created successfully!")
            print(f"📁 Location: {self.target_dir}")
            print("\n🚀 Next steps:")
            print(f"   cd {self.target_dir}")
            print("   python scripts/validate_best_practices.py")
            print("   python -m pytest tests/ -v")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating project: {e}")
            return False
    
    def _copy_boilerplate_files(self):
        """Copy boilerplate files to target directory."""
        print("📋 Copying boilerplate files...")
        
        # Files and directories to copy
        items_to_copy = [
            'src',
            'tests',
            'scripts',
            'docs',
            'config',
            '.gitignore',
            'requirements.txt',
            'OPENHANDS_BEST_PRACTICES.md',
            'LICENSE'
        ]
        
        for item in items_to_copy:
            source = self.boilerplate_dir / item
            target = self.target_dir / item
            
            if source.exists():
                if source.is_dir():
                    shutil.copytree(source, target, dirs_exist_ok=True)
                else:
                    shutil.copy2(source, target)
                print(f"   ✓ Copied {item}")
    
    def _customize_templates(self):
        """Customize template files with project-specific information."""
        print("🔧 Customizing templates...")
        
        # Customize README.md
        readme_template = f"""# {self.project_name}

A new OpenHands project following best practices.

## Description

{self.project_name} is a greenfield project built using OpenHands best practices
and the OpenHands Repository Boilerplate.

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd {self.project_name}
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Add your usage instructions here.

## Development

This project follows OpenHands best practices. See [OPENHANDS_BEST_PRACTICES.md](OPENHANDS_BEST_PRACTICES.md) for detailed guidelines.

### Validation

Run validation checks:
```bash
python scripts/validate_best_practices.py
```

### Testing

Run tests:
```bash
python -m pytest tests/ -v
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following best practices
4. Run validation and tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
"""
        
        readme_path = self.target_dir / 'README.md'
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_template)
        print("   ✓ Customized README.md")
        
        # Customize CHANGELOG.md
        changelog_template = f"""# Changelog

All notable changes to {self.project_name} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup using OpenHands boilerplate
- Basic project structure and configuration
- Best practices validation tools

## [0.1.0] - {self._get_current_date()}

### Added
- Initial release of {self.project_name}
- Project structure following OpenHands best practices
- Automated validation and testing framework
"""
        
        changelog_path = self.target_dir / 'CHANGELOG.md'
        with open(changelog_path, 'w', encoding='utf-8') as f:
            f.write(changelog_template)
        print("   ✓ Customized CHANGELOG.md")
    
    def _initialize_git(self):
        """Initialize git repository."""
        print("🔄 Initializing git repository...")
        
        try:
            # Initialize git
            subprocess.run(['git', 'init'], cwd=self.target_dir, check=True, capture_output=True)
            print("   ✓ Git repository initialized")
            
            # Add all files
            subprocess.run(['git', 'add', '.'], cwd=self.target_dir, check=True, capture_output=True)
            print("   ✓ Files staged")
            
            # Initial commit
            commit_message = f"Initial commit: {self.project_name} with OpenHands boilerplate\\n\\nCo-authored-by: openhands <openhands@all-hands.dev>"
            subprocess.run(
                ['git', 'commit', '-m', commit_message],
                cwd=self.target_dir,
                check=True,
                capture_output=True
            )
            print("   ✓ Initial commit created")
            
        except subprocess.CalledProcessError as e:
            print(f"   ⚠️  Git initialization failed: {e}")
            print("   You can initialize git manually later")
    
    def _setup_development_environment(self):
        """Set up development environment."""
        print("🛠️  Setting up development environment...")
        
        # Make scripts executable
        scripts_dir = self.target_dir / 'scripts'
        if scripts_dir.exists():
            for script in scripts_dir.glob('*.py'):
                script.chmod(0o755)
            print("   ✓ Made scripts executable")
        
        # Create virtual environment (optional)
        venv_path = self.target_dir / 'venv'
        try:
            subprocess.run([sys.executable, '-m', 'venv', str(venv_path)], check=True, capture_output=True)
            print("   ✓ Virtual environment created")
            
            # Install dependencies in virtual environment
            pip_path = venv_path / 'bin' / 'pip' if os.name != 'nt' else venv_path / 'Scripts' / 'pip.exe'
            if pip_path.exists():
                subprocess.run([str(pip_path), 'install', '-r', 'requirements.txt'], 
                             cwd=self.target_dir, check=True, capture_output=True)
                print("   ✓ Dependencies installed in virtual environment")
        except subprocess.CalledProcessError:
            print("   ⚠️  Virtual environment setup failed (optional)")
    
    def _get_current_date(self) -> str:
        """Get current date in YYYY-MM-DD format."""
        from datetime import datetime
        return datetime.now().strftime('%Y-%m-%d')


def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(
        description='Set up a new OpenHands project from boilerplate'
    )
    parser.add_argument(
        'project_name',
        help='Name of the new project'
    )
    parser.add_argument(
        '--target-dir',
        help='Target directory for the project (default: ./project_name)'
    )
    parser.add_argument(
        '--no-git',
        action='store_true',
        help='Skip git initialization'
    )
    parser.add_argument(
        '--no-venv',
        action='store_true',
        help='Skip virtual environment creation'
    )
    
    args = parser.parse_args()
    
    # Validate project name
    if not args.project_name.replace('-', '').replace('_', '').isalnum():
        print("❌ Project name should contain only letters, numbers, hyphens, and underscores")
        sys.exit(1)
    
    # Create project
    setup = ProjectSetup(args.project_name, args.target_dir)
    success = setup.create_project()
    
    if not success:
        sys.exit(1)


if __name__ == '__main__':
    main()