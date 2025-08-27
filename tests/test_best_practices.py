#!/usr/bin/env python3
"""
OpenHands Best Practices Validation Test Suite

This test suite validates that a project follows OpenHands best practices
for greenfield projects. It checks project structure, file naming conventions,
git configuration, and other standards.
"""

import os
import re
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any
import unittest


class OpenHandsBestPracticesTest(unittest.TestCase):
    """Test suite for validating OpenHands best practices compliance."""
    
    def setUp(self):
        """Set up test environment."""
        self.project_root = Path.cwd()
        self.required_files = [
            'README.md',
            '.gitignore',
            'CHANGELOG.md'
        ]
        self.recommended_dirs = [
            'src',
            'tests',
            'docs',
            'scripts'
        ]
    
    def test_project_structure_exists(self):
        """Test that essential project structure exists."""
        for file_name in self.required_files:
            file_path = self.project_root / file_name
            self.assertTrue(
                file_path.exists(),
                f"Required file {file_name} is missing from project root"
            )
    
    def test_readme_content_quality(self):
        """Test that README.md contains essential information."""
        readme_path = self.project_root / 'README.md'
        if not readme_path.exists():
            self.skipTest("README.md not found")
        
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read().lower()
        
        required_sections = [
            'installation',
            'usage',
            'description'
        ]
        
        for section in required_sections:
            self.assertIn(
                section,
                content,
                f"README.md should contain information about {section}"
            )
    
    def test_gitignore_exists_and_not_empty(self):
        """Test that .gitignore exists and has content."""
        gitignore_path = self.project_root / '.gitignore'
        self.assertTrue(
            gitignore_path.exists(),
            ".gitignore file is required"
        )
        
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        self.assertTrue(
            len(content) > 0,
            ".gitignore should not be empty"
        )
    
    def test_no_duplicate_file_versions(self):
        """Test that there are no duplicate file versions with suffixes."""
        problematic_patterns = [
            r'.*_test\.(py|js|ts|java|cpp|c)$',
            r'.*_fix\.(py|js|ts|java|cpp|c)$',
            r'.*_simple\.(py|js|ts|java|cpp|c)$',
            r'.*_backup\.(py|js|ts|java|cpp|c)$',
            r'.*_old\.(py|js|ts|java|cpp|c)$',
            r'.*_new\.(py|js|ts|java|cpp|c)$'
        ]
        
        found_problematic_files = []
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip .git directory
            if '.git' in root:
                continue
                
            for file in files:
                for pattern in problematic_patterns:
                    if re.match(pattern, file):
                        found_problematic_files.append(os.path.join(root, file))
        
        self.assertEqual(
            len(found_problematic_files),
            0,
            f"Found files with problematic suffixes: {found_problematic_files}. "
            "Use version control instead of file suffixes."
        )
    
    def test_git_configuration(self):
        """Test that git is properly configured."""
        try:
            # Check if git is initialized
            result = subprocess.run(
                ['git', 'status'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            self.assertEqual(
                result.returncode,
                0,
                "Git repository should be initialized"
            )
            
            # Check git user configuration
            user_name = subprocess.run(
                ['git', 'config', 'user.name'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            user_email = subprocess.run(
                ['git', 'config', 'user.email'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            self.assertTrue(
                user_name.stdout.strip(),
                "Git user.name should be configured"
            )
            
            self.assertTrue(
                user_email.stdout.strip(),
                "Git user.email should be configured"
            )
            
        except FileNotFoundError:
            self.skipTest("Git is not available in the environment")
    
    def test_no_sensitive_files_in_git(self):
        """Test that sensitive files are not tracked by git."""
        sensitive_patterns = [
            r'\.env$',
            r'\.env\..*',
            r'.*\.key$',
            r'.*\.pem$',
            r'config\.json$',
            r'secrets\..*'
        ]
        
        try:
            # Get list of tracked files
            result = subprocess.run(
                ['git', 'ls-files'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                self.skipTest("Could not get git tracked files")
            
            tracked_files = result.stdout.strip().split('\n')
            sensitive_files = []
            
            for file in tracked_files:
                for pattern in sensitive_patterns:
                    if re.search(pattern, file):
                        sensitive_files.append(file)
            
            self.assertEqual(
                len(sensitive_files),
                0,
                f"Sensitive files should not be tracked: {sensitive_files}"
            )
            
        except FileNotFoundError:
            self.skipTest("Git is not available in the environment")
    
    def test_file_naming_conventions(self):
        """Test that files follow proper naming conventions."""
        problematic_files = []
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip .git directory
            if '.git' in root:
                continue
            
            for file in files:
                # Check for spaces in filenames
                if ' ' in file:
                    problematic_files.append(f"{file}: contains spaces")
                
                # Check for special characters (except common ones)
                if re.search(r'[^a-zA-Z0-9._-]', file):
                    problematic_files.append(f"{file}: contains special characters")
        
        self.assertEqual(
            len(problematic_files),
            0,
            f"Files with naming issues found: {problematic_files}"
        )
    
    def test_dependency_files_exist(self):
        """Test that appropriate dependency files exist for the project type."""
        dependency_files = {
            'requirements.txt': 'Python',
            'pyproject.toml': 'Python',
            'package.json': 'Node.js',
            'Gemfile': 'Ruby',
            'pom.xml': 'Java (Maven)',
            'build.gradle': 'Java (Gradle)',
            'Cargo.toml': 'Rust',
            'go.mod': 'Go'
        }
        
        found_dependency_files = []
        for dep_file in dependency_files:
            if (self.project_root / dep_file).exists():
                found_dependency_files.append(dep_file)
        
        # At least one dependency file should exist for most projects
        # This is a warning rather than a hard requirement
        if not found_dependency_files:
            print("Warning: No dependency management files found. "
                  "Consider adding appropriate dependency files for your project type.")
    
    def test_test_directory_structure(self):
        """Test that test directory follows good structure."""
        test_dir = self.project_root / 'tests'
        if not test_dir.exists():
            self.skipTest("Tests directory not found")
        
        # Check for test files
        test_files = list(test_dir.rglob('test_*.py')) + list(test_dir.rglob('*_test.py'))
        
        self.assertTrue(
            len(test_files) > 0,
            "Tests directory should contain test files"
        )
    
    def test_changelog_format(self):
        """Test that CHANGELOG.md follows a reasonable format."""
        changelog_path = self.project_root / 'CHANGELOG.md'
        if not changelog_path.exists():
            self.skipTest("CHANGELOG.md not found")
        
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for version headers (basic format check)
        version_pattern = r'##?\s*\[?\d+\.\d+\.\d+\]?'
        versions_found = re.findall(version_pattern, content)
        
        # Should have at least some structure
        self.assertTrue(
            len(content.strip()) > 0,
            "CHANGELOG.md should not be empty"
        )
    
    def test_source_code_organization(self):
        """Test that source code is properly organized."""
        # Check for common source directories
        source_dirs = ['src', 'lib', 'app']
        found_source_dir = False
        
        for src_dir in source_dirs:
            if (self.project_root / src_dir).exists():
                found_source_dir = True
                break
        
        # This is more of a recommendation than a hard requirement
        if not found_source_dir:
            print("Recommendation: Consider organizing source code in a dedicated directory (src/, lib/, app/)")
    
    def test_no_build_artifacts_in_git(self):
        """Test that build artifacts are not tracked by git."""
        build_patterns = [
            r'__pycache__',
            r'\.pyc$',
            r'node_modules',
            r'\.class$',
            r'target/',
            r'build/',
            r'dist/',
            r'\.o$',
            r'\.exe$'
        ]
        
        try:
            result = subprocess.run(
                ['git', 'ls-files'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                self.skipTest("Could not get git tracked files")
            
            tracked_files = result.stdout.strip().split('\n')
            build_artifacts = []
            
            for file in tracked_files:
                for pattern in build_patterns:
                    if re.search(pattern, file):
                        build_artifacts.append(file)
            
            self.assertEqual(
                len(build_artifacts),
                0,
                f"Build artifacts should not be tracked: {build_artifacts}"
            )
            
        except FileNotFoundError:
            self.skipTest("Git is not available in the environment")


class ProjectStructureValidator:
    """Utility class for validating project structure."""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
    
    def validate_structure(self) -> Dict[str, Any]:
        """Validate project structure and return results."""
        results = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'recommendations': []
        }
        
        # Check required files
        required_files = ['README.md', '.gitignore']
        for file_name in required_files:
            if not (self.project_root / file_name).exists():
                results['errors'].append(f"Missing required file: {file_name}")
                results['valid'] = False
        
        # Check for recommended structure
        recommended_dirs = ['src', 'tests', 'docs']
        for dir_name in recommended_dirs:
            if not (self.project_root / dir_name).exists():
                results['recommendations'].append(f"Consider adding directory: {dir_name}")
        
        return results


def run_validation_suite(project_root: str = None) -> Dict[str, Any]:
    """Run the complete validation suite and return results."""
    if project_root is None:
        project_root = os.getcwd()
    
    # Change to project directory
    original_cwd = os.getcwd()
    os.chdir(project_root)
    
    try:
        # Run unittest suite
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromTestCase(OpenHandsBestPracticesTest)
        runner = unittest.TextTestRunner(verbosity=2, stream=open(os.devnull, 'w'))
        result = runner.run(suite)
        
        # Collect results
        validation_results = {
            'tests_run': result.testsRun,
            'failures': len(result.failures),
            'errors': len(result.errors),
            'success': result.wasSuccessful(),
            'failure_details': [str(failure[1]) for failure in result.failures],
            'error_details': [str(error[1]) for error in result.errors]
        }
        
        return validation_results
        
    finally:
        os.chdir(original_cwd)


if __name__ == '__main__':
    # Run tests when script is executed directly
    unittest.main(verbosity=2)