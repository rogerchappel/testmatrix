# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Changed

- Replace the unavailable npm installation guidance with a source install and
  verify the packed CLI from a clean temporary consumer during release checks.
- Disable npm publication while the configured name belongs to a security-holder
  package, and guard release checks against accidentally re-enabling it.

### Fixed

- Make rules whose colon is preceded by spaces or tabs (for example
  `lint2 : tools` or a tabbed `fullcheck :: extras`) are now detected under
  each declared target name, matching GNU Make; prerequisites and dot-prefixed
  special targets stay out of the matrix.
- Detected commands no longer run with a forced `CI=1`. The caller's
  environment is passed through unchanged so local runs report local reality.

### Added

- Initial project setup.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/testmatrix/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/testmatrix/releases/latest`

Replace placeholder links once the first release tag exists.
