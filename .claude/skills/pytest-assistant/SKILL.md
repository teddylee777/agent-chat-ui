---
name: pytest-assistant
description: Pytest-based test code writing and ruff linting helper for langgraph-deep-agents repository. Use when (1) writing pytest for a new agent, (2) updating tests after agent modification, (3) running ruff code quality checks, (4) generating test scaffolding for LangGraph agents.
---

# pytest-assistant

Helps write pytest tests and run ruff linting for LangGraph agents.

## On Skill Start

When this skill is activated, first display this command reference:

```
╔══════════════════════════════════════════════════════════════╗
║  🧪 pytest-assistant                                         ║
╠══════════════════════════════════════════════════════════════╣
║  Commands:                                                   ║
║    uv run pytest tests/                      # Run all tests ║
║    uv run pytest tests/test_<agent>.py -v    # Specific      ║
║    uv run ruff check .                       # Lint check    ║
║    uv run ruff check . --fix                 # Auto-fix      ║
║    uv run ruff format .                      # Format code   ║
╚══════════════════════════════════════════════════════════════╝
```

## Result Display Format

When displaying test or lint results, use these emoji patterns:

```
✅ PASSED  test_name
❌ FAILED  test_name
⚠️  WARNING: description
🔧 FIXED: description
📊 Summary: X/Y tests passed (Z%)
🧪 Running: command
🔍 Checking: description
```

## Quick Reference

| Task | Command |
|------|---------|
| Run all tests | `uv run pytest tests/` |
| Run specific test | `uv run pytest tests/test_<agent>.py -v` |
| Lint check | `uv run ruff check .` |
| Auto-fix lint | `uv run ruff check . --fix` |
| Format code | `uv run ruff format .` |

## Test File Structure

### Naming Convention
- Test file: `tests/test_{agent_name}.py`
- Test class: `Test{AgentName}{Category}`
- Test method: `test_{what_is_being_tested}`

### Agent Files to Test
```
agent/{agent_name}/
├── __init__.py
├── agent.py          # Main agent class
├── configuration.py  # Runtime configuration
├── middleware.py     # Request/response processing
├── prompt.py         # System prompt
├── state.py          # State schema
└── tool.py           # Tool definitions
```

## Test Categories

Create 6 test classes per agent (total ~10 tests recommended):

| Class | Purpose | Tests |
|-------|---------|-------|
| `Test{Agent}Class` | Class inheritance, init, build | 2-3 |
| `Test{Agent}Tools` | Tool list, individual invocation | 2-3 |
| `Test{Agent}Configuration` | Defaults, from_runnable_config | 2 |
| `Test{Agent}Middleware` | Middleware list, types | 1-2 |
| `Test{Agent}State` | State field existence | 1 |
| `Test{Agent}Integration` | Async invoke (optional) | 1 |

## Test Workflow

### 1. Analyze Agent
Read the agent files to understand:
- Agent class name and inheritance
- Available tools and their parameters
- Configuration fields and defaults
- Middleware components
- State schema

### 2. Generate Test File
Create `tests/test_{agent_name}.py` with:
- Standard imports
- 6 test class scaffolding
- English docstrings

### 3. Write Test Cases
See reference files for detailed code patterns:
- Agent tests: [references/agent-test-patterns.md](references/agent-test-patterns.md)
- Tool tests: [references/tool-test-patterns.md](references/tool-test-patterns.md)
- Middleware tests: [references/middleware-test-patterns.md](references/middleware-test-patterns.md)

### 4. Run Tests
```
🧪 Running: uv run pytest tests/test_{agent}.py -v

✅ PASSED  test_agent_initialization
✅ PASSED  test_agent_inherits_base_agent
✅ PASSED  test_get_tools_returns_list
❌ FAILED  test_tool_invocation

📊 Summary: 3/4 tests passed (75%)
```

### 5. Run Ruff
```
🔍 Running: uv run ruff check tests/test_{agent}.py

⚠️  WARNING: F401 'os' imported but unused
🔧 Running: uv run ruff check --fix
✅ Fixed 1 issue
```

## Reference Navigation

| Need | Read |
|------|------|
| **Agent Tests** | |
| Agent class test templates | [references/agent-test-patterns.md](references/agent-test-patterns.md) |
| Full agent test file template | [references/agent-test-patterns.md#full-template](references/agent-test-patterns.md) |
| Agent async integration tests | [references/agent-test-patterns.md#integration](references/agent-test-patterns.md) |
| **Tool Tests** | |
| Tool test templates | [references/tool-test-patterns.md](references/tool-test-patterns.md) |
| Schema validation tests | [references/tool-test-patterns.md#schema-tests](references/tool-test-patterns.md) |
| Tool initialization tests | [references/tool-test-patterns.md#initialization-tests](references/tool-test-patterns.md) |
| Error handling patterns | [references/tool-test-patterns.md#error-handling-tests](references/tool-test-patterns.md) |
| **Middleware Tests** | |
| Middleware test templates | [references/middleware-test-patterns.md](references/middleware-test-patterns.md) |
| Sync hook tests | [references/middleware-test-patterns.md#sync-hook-tests](references/middleware-test-patterns.md) |
| Async hook tests | [references/middleware-test-patterns.md#async-hook-tests](references/middleware-test-patterns.md) |
| Context handling tests | [references/middleware-test-patterns.md#context-tests](references/middleware-test-patterns.md) |
