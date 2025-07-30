# Change Log

All notable changes to the "scraps" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2025-07-30

### Fixed
- Remove uuid dependency to fix extension activation error

## [0.1.2] - 2025-07-30

### Fixed
- Use onStartupFinished to ensure command registration

## [0.1.1] - 2025-07-30

### Fixed
- Add activation event to fix "command not found" error

## [0.1.0] - 2025-07-10

### Added
- Flexible storage system with file and global storage options
- Hierarchical tree view for organizing scraps by storage type
- File-based storage for workspace-specific notes (.scraps directory)
- Data migration tool for upgrading from old format
- Comprehensive test suite with sinon mocking
- CI/CD workflow with GitHub Actions
- Philosophy statement in README

### Changed
- Refactored storage architecture to support multiple providers
- Moved tests to root directory for better organization
- Updated TypeScript and ESLint configurations

### Removed
- Legacy old editor provider code

## [0.0.1] - Initial Release

### Added
- Basic note-taking functionality in VSCode sidebar
- Create, edit, rename, and delete scraps
- Webview-based editor with React
- Global state storage for notes