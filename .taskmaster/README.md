# TaskMaster Configuration for FocusFlow

This directory contains the TaskMaster configuration for the FocusFlow productivity tracker project.

## Files

- **config.json** - Main TaskMaster configuration with AI models, project settings, and task categories
- **state.json** - Runtime state tracking for TaskMaster sessions and statistics
- **outputs/** - Directory for TaskMaster generated outputs and reports

## Setup

1. **Install TaskMaster** (if not already installed):
   ```bash
   npm install -g claude-task-master
   ```

2. **Configure API Keys**:
   - Copy `.env.example` to `.env` in the project root
   - Add your Anthropic API key: `ANTHROPIC_API_KEY=your_key_here`

3. **Initialize TaskMaster**:
   ```bash
   task-master init
   ```

4. **Verify Configuration**:
   ```bash
   task-master models --list
   ```

## Project Configuration

This TaskMaster setup is configured for:
- **Framework**: Next.js 15 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI**: Radix UI with Tailwind CSS
- **Key Features**: Pomodoro timer, session tracking, analytics

## Available Task Categories

- development
- testing
- documentation
- planning
- research
- debugging
- refactoring
- deployment

## Usage Examples

```bash
# Start a development task
task-master create "Implement user authentication" --tag development

# Run research task
task-master create "Research React 19 features" --tag research

# Generate documentation
task-master create "Update API documentation" --tag documentation
```

## Project-Specific Settings

- **Default Duration**: 50 minutes (matching Pomodoro timer)
- **Efficiency Tracking**: Enabled
- **Custom Tasks**: Allowed
- **Context Size**: Large (for complex codebase analysis)