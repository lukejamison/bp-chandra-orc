# Contributing to BP Chandra OCR

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and encourage diverse perspectives
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker and Docker Compose
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/bp-chandra-orc.git
   cd bp-chandra-orc
   ```

2. **Install dependencies**
   ```bash
   make install
   # or manually:
   npm install
   cd python-backend && pip install -r requirements.txt
   ```

3. **Set up environment**
   ```bash
   make setup
   # Edit .env files with your configuration
   ```

4. **Start development servers**
   ```bash
   make dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - Feature branches
- `fix/bug-name` - Bug fix branches
- `docs/doc-name` - Documentation branches

### Creating a Feature

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Describe your changes
   - Link related issues

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(api): add batch processing endpoint
fix(ui): resolve upload progress bar issue
docs(readme): update installation instructions
```

## Code Style

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Use meaningful variable names
- Add JSDoc comments for functions

```typescript
/**
 * Process a document with OCR
 * @param file - The file to process
 * @param options - OCR processing options
 * @returns Promise with OCR result
 */
async function processDocument(file: File, options: OCROptions): Promise<OCRResult> {
  // Implementation
}
```

### Python

- Follow PEP 8 style guide
- Use Black for formatting
- Add type hints
- Use docstrings for functions

```python
def process_document(
    file_path: str,
    options: OCROptions,
    request_id: Optional[str] = None
) -> OCRResult:
    """
    Process a document using Chandra OCR.
    
    Args:
        file_path: Path to the document file
        options: OCR processing options
        request_id: Optional request ID for tracking
        
    Returns:
        OCRResult with extracted content
    """
    # Implementation
```

## Testing

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
make format
```

### Writing Tests

Add tests for:
- New features
- Bug fixes
- Edge cases
- Error handling

Example test structure:
```typescript
describe('OCR Processing', () => {
  it('should process PDF document', async () => {
    // Arrange
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    // Act
    const result = await processOCR(file);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data.jobId).toBeDefined();
  });
});
```

## Documentation

### Code Documentation

- Add comments for complex logic
- Use JSDoc/docstrings for functions
- Document API endpoints
- Update README for new features

### API Documentation

When adding new endpoints:
1. Update `API_DOCUMENTATION.md`
2. Add examples
3. Document error cases
4. Include curl examples

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No linting errors
- [ ] Commit messages follow convention

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process

1. Maintainers will review your PR
2. Address review comments
3. Once approved, PR will be merged
4. Delete your feature branch

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
Add screenshots if applicable

**Environment:**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want

**Describe alternatives you've considered**
Alternative solutions considered

**Additional context**
Any other context or screenshots
```

## Architecture Guidelines

### Frontend (Next.js)

- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for type safety
- Follow component structure:
  ```
  components/
  ├── ComponentName/
  │   ├── ComponentName.tsx
  │   ├── ComponentName.test.tsx
  │   └── index.ts
  ```

### Backend (Python)

- Use FastAPI for API endpoints
- Implement proper error handling
- Use Pydantic for validation
- Follow module structure:
  ```
  app/
  ├── api/
  ├── services/
  ├── models/
  ├── utils/
  └── main.py
  ```

### Logging

Always add logging for:
- Function entry/exit (debug level)
- Important operations (info level)
- Errors (error level)
- User actions (info level)

```typescript
logger.info('Processing document', { 
  jobId, 
  filename: file.name, 
  size: file.size 
});
```

## Need Help?

- Check existing issues
- Read documentation
- Ask in discussions
- Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in README

Thank you for contributing! 🎉

