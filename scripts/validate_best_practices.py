#!/usr/bin/env python3
"""
OpenHands Best Practices Validation Script

This script provides a comprehensive validation of OpenHands best practices
for greenfield projects. It can be run standalone or integrated into CI/CD pipelines.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List
import subprocess
import re


class BestPracticesValidator:
    """Main validator class for OpenHands best practices."""
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.results = {
            'overall_score': 0,
            'max_score': 0,
            'passed_checks': [],
            'failed_checks': [],
            'warnings': [],
            'recommendations': []
        }
    
    def validate_all(self) -> Dict[str, Any]:
        """Run all validation checks."""
        checks = [
            self._check_required_files,
            self._check_readme_quality,
            self._check_gitignore,
            self._check_git_configuration,
            self._check_file_naming,
            self._check_no_duplicate_versions,
            self._check_no_sensitive_files,
            self._check_no_build_artifacts,
            self._check_project_structure,
            self._check_dependency_management
        ]
        
        for check in checks:
            try:
                check()
            except Exception as e:
                self.results['failed_checks'].append({
                    'check': check.__name__,
                    'error': str(e)
                })
        
        # Calculate overall score
        total_checks = len(self.results['passed_checks']) + len(self.results['failed_checks'])
        if total_checks > 0:
            self.results['overall_score'] = len(self.results['passed_checks']) / total_checks * 100
        
        return self.results
    
    def _check_required_files(self):
        """Check for required project files."""
        required_files = ['README.md', '.gitignore']
        missing_files = []
        
        for file_name in required_files:
            if not (self.project_root / file_name).exists():
                missing_files.append(file_name)
        
        if missing_files:
            self.results['failed_checks'].append({
                'check': 'Required Files',
                'message': f"Missing required files: {', '.join(missing_files)}"
            })
        else:
            self.results['passed_checks'].append({
                'check': 'Required Files',
                'message': 'All required files present'
            })
    
    def _check_readme_quality(self):
        """Check README.md quality."""
        readme_path = self.project_root / 'README.md'
        if not readme_path.exists():
            return  # Already handled in required files check
        
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read().lower()
        
        required_sections = ['description', 'installation', 'usage']
        missing_sections = []
        
        for section in required_sections:
            if section not in content:
                missing_sections.append(section)
        
        if missing_sections:
            self.results['warnings'].append({
                'check': 'README Quality',
                'message': f"README.md missing sections: {', '.join(missing_sections)}"
            })
        else:
            self.results['passed_checks'].append({
                'check': 'README Quality',
                'message': 'README.md contains essential sections'
            })
    
    def _check_gitignore(self):
        """Check .gitignore file."""
        gitignore_path = self.project_root / '.gitignore'
        if not gitignore_path.exists():
            return  # Already handled in required files check
        
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        if not content:
            self.results['failed_checks'].append({
                'check': 'Gitignore',
                'message': '.gitignore file is empty'
            })
        else:
            self.results['passed_checks'].append({
                'check': 'Gitignore',
                'message': '.gitignore file has content'
            })
    
    def _check_git_configuration(self):
        """Check git configuration."""
        try:
            # Check if git is initialized
            result = subprocess.run(
                ['git', 'status'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                self.results['failed_checks'].append({
                    'check': 'Git Configuration',
                    'message': 'Git repository not initialized'
                })
                return
            
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
            
            issues = []
            if not user_name.stdout.strip():
                issues.append('user.name not configured')
            if not user_email.stdout.strip():
                issues.append('user.email not configured')
            
            if issues:
                self.results['warnings'].append({
                    'check': 'Git Configuration',
                    'message': f"Git configuration issues: {', '.join(issues)}"
                })
            else:
                self.results['passed_checks'].append({
                    'check': 'Git Configuration',
                    'message': 'Git properly configured'
                })
                
        except FileNotFoundError:
            self.results['warnings'].append({
                'check': 'Git Configuration',
                'message': 'Git not available in environment'
            })
    
    def _check_file_naming(self):
        """Check file naming conventions."""
        problematic_files = []
        
        for root, dirs, files in os.walk(self.project_root):
            if '.git' in root:
                continue
            
            for file in files:
                if ' ' in file:
                    problematic_files.append(f"{file}: contains spaces")
                elif re.search(r'[^a-zA-Z0-9._-]', file):
                    problematic_files.append(f"{file}: contains special characters")
        
        if problematic_files:
            self.results['failed_checks'].append({
                'check': 'File Naming',
                'message': f"Files with naming issues: {problematic_files[:5]}"  # Limit output
            })
        else:
            self.results['passed_checks'].append({
                'check': 'File Naming',
                'message': 'All files follow naming conventions'
            })
    
    def _check_no_duplicate_versions(self):
        """Check for duplicate file versions with suffixes."""
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
            if '.git' in root:
                continue
            
            for file in files:
                for pattern in problematic_patterns:
                    if re.match(pattern, file):
                        found_problematic_files.append(file)
        
        if found_problematic_files:
            self.results['failed_checks'].append({
                'check': 'No Duplicate Versions',
                'message': f"Files with version suffixes found: {found_problematic_files[:3]}"
            })
        else:
            self.results['passed_checks'].append({
                'check': 'No Duplicate Versions',
                'message': 'No duplicate file versions found'
            })
    
    def _check_no_sensitive_files(self):
        """Check that sensitive files are not tracked."""
        sensitive_patterns = [
            r'\.env$',
            r'\.env\..*',
            r'.*\.key$',
            r'.*\.pem$',
            r'config\.json$',
            r'secrets\..*'
        ]
        
        try:
            result = subprocess.run(
                ['git', 'ls-files'],
                cwd=self.project_root,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return
            
            tracked_files = result.stdout.strip().split('\n')
            sensitive_files = []
            
            for file in tracked_files:
                for pattern in sensitive_patterns:
                    if re.search(pattern, file):
                        sensitive_files.append(file)
            
            if sensitive_files:
                self.results['failed_checks'].append({
                    'check': 'No Sensitive Files',
                    'message': f"Sensitive files tracked: {sensitive_files}"
                })
            else:
                self.results['passed_checks'].append({
                    'check': 'No Sensitive Files',
                    'message': 'No sensitive files tracked'
                })
                
        except FileNotFoundError:
            pass  # Git not available
    
    def _check_no_build_artifacts(self):
        """Check that build artifacts are not tracked."""
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
                return
            
            tracked_files = result.stdout.strip().split('\n')
            build_artifacts = []
            
            for file in tracked_files:
                for pattern in build_patterns:
                    if re.search(pattern, file):
                        build_artifacts.append(file)
            
            if build_artifacts:
                self.results['failed_checks'].append({
                    'check': 'No Build Artifacts',
                    'message': f"Build artifacts tracked: {build_artifacts[:3]}"
                })
            else:
                self.results['passed_checks'].append({
                    'check': 'No Build Artifacts',
                    'message': 'No build artifacts tracked'
                })
                
        except FileNotFoundError:
            pass  # Git not available
    
    def _check_project_structure(self):
        """Check recommended project structure."""
        recommended_dirs = ['src', 'tests', 'docs', 'scripts']
        missing_dirs = []
        
        for dir_name in recommended_dirs:
            if not (self.project_root / dir_name).exists():
                missing_dirs.append(dir_name)
        
        if missing_dirs:
            self.results['recommendations'].append({
                'check': 'Project Structure',
                'message': f"Consider adding directories: {', '.join(missing_dirs)}"
            })
        else:
            self.results['passed_checks'].append({
                'check': 'Project Structure',
                'message': 'Good project structure'
            })
    
    def _check_dependency_management(self):
        """Check for dependency management files."""
        dependency_files = [
            'requirements.txt', 'pyproject.toml', 'package.json',
            'Gemfile', 'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod'
        ]
        
        found_files = []
        for dep_file in dependency_files:
            if (self.project_root / dep_file).exists():
                found_files.append(dep_file)
        
        if not found_files:
            self.results['recommendations'].append({
                'check': 'Dependency Management',
                'message': 'Consider adding dependency management files'
            })
        else:
            self.results['passed_checks'].append({
                'check': 'Dependency Management',
                'message': f"Found dependency files: {', '.join(found_files)}"
            })


def print_results(results: Dict[str, Any], verbose: bool = False):
    """Print validation results in a readable format."""
    print(f"\n{'='*60}")
    print("OpenHands Best Practices Validation Results")
    print(f"{'='*60}")
    
    print(f"\nOverall Score: {results['overall_score']:.1f}%")
    
    if results['passed_checks']:
        print(f"\n✅ Passed Checks ({len(results['passed_checks'])}):")
        for check in results['passed_checks']:
            print(f"  • {check['check']}: {check['message']}")
    
    if results['failed_checks']:
        print(f"\n❌ Failed Checks ({len(results['failed_checks'])}):")
        for check in results['failed_checks']:
            print(f"  • {check['check']}: {check['message']}")
    
    if results['warnings']:
        print(f"\n⚠️  Warnings ({len(results['warnings'])}):")
        for warning in results['warnings']:
            print(f"  • {warning['check']}: {warning['message']}")
    
    if results['recommendations']:
        print(f"\n💡 Recommendations ({len(results['recommendations'])}):")
        for rec in results['recommendations']:
            print(f"  • {rec['check']}: {rec['message']}")
    
    print(f"\n{'='*60}")


def main():
    """Main function for command-line usage."""
    parser = argparse.ArgumentParser(
        description='Validate OpenHands best practices for greenfield projects'
    )
    parser.add_argument(
        '--project-root',
        default='.',
        help='Path to project root directory (default: current directory)'
    )
    parser.add_argument(
        '--output-format',
        choices=['text', 'json'],
        default='text',
        help='Output format (default: text)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Verbose output'
    )
    parser.add_argument(
        '--fail-on-error',
        action='store_true',
        help='Exit with non-zero code if any checks fail'
    )
    
    args = parser.parse_args()
    
    validator = BestPracticesValidator(args.project_root)
    results = validator.validate_all()
    
    if args.output_format == 'json':
        print(json.dumps(results, indent=2))
    else:
        print_results(results, args.verbose)
    
    # Exit with error code if requested and there are failures
    if args.fail_on_error and results['failed_checks']:
        sys.exit(1)


if __name__ == '__main__':
    main()