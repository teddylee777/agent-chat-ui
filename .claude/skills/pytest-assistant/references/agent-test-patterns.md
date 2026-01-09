# Test Patterns Reference

## Table of Contents
- [Full Template](#full-template)
- [TestAgentClass](#testagentclass)
- [TestAgentTools](#testagenttools)
- [TestAgentConfiguration](#testagentconfiguration)
- [TestAgentMiddleware](#testagentmiddleware)
- [TestAgentState](#testagentstate)
- [TestAgentIntegration](#integration)

## Full Template

```python
"""Test module for {AgentName} Agent

Tests for verifying {AgentName} agent functionality.
"""

import pytest

from agent.{agent_name} import {AgentName}
from agent.{agent_name}.state import {AgentName}State
from agent.{agent_name}.prompt import SYSTEM_PROMPT
from agent.{agent_name}.tool import get_tools, tool_name_1, tool_name_2
from agent.{agent_name}.configuration import Configuration
from agent.{agent_name}.middleware import get_middlewares


class Test{AgentName}Class:
    """{AgentName} class tests"""

    def test_agent_inherits_base_agent(self):
        """Verify {AgentName} inherits from BaseAgent"""
        from agent.base import BaseAgent
        agent = {AgentName}()
        assert isinstance(agent, BaseAgent)

    def test_agent_initialization(self):
        """Test agent initialization"""
        agent = {AgentName}()
        assert agent is not None

    def test_agent_build(self):
        """Verify build() returns runnable graph"""
        agent = {AgentName}()
        graph = agent.build()
        assert graph is not None
        assert hasattr(graph, "invoke")


class Test{AgentName}Tools:
    """{AgentName} tools tests"""

    def test_get_tools_returns_list(self):
        """Verify get_tools returns tool list"""
        tools = get_tools()
        assert isinstance(tools, list)
        assert len(tools) > 0

    def test_tool_invocation(self):
        """Test individual tool invocation"""
        result = tool_name_1.invoke({
            "param1": "value1",
            "param2": "value2",
        })
        assert isinstance(result, str)
        assert "expected_content" in result


class Test{AgentName}Configuration:
    """{AgentName} configuration tests"""

    def test_configuration_defaults(self):
        """Test configuration default values"""
        config = Configuration()
        assert config.model is not None

    def test_configuration_from_runnable_config(self):
        """Test from_runnable_config parsing"""
        runnable_config = {
            "configurable": {
                "model": "anthropic:claude-sonnet-4-5",
            }
        }
        config = Configuration.from_runnable_config(runnable_config)
        assert config.model == "anthropic:claude-sonnet-4-5"


class Test{AgentName}Middleware:
    """{AgentName} middleware tests"""

    def test_get_middlewares_returns_list(self):
        """Verify get_middlewares returns middleware list"""
        middlewares = get_middlewares()
        assert isinstance(middlewares, list)


class Test{AgentName}State:
    """{AgentName} state tests"""

    def test_state_has_messages(self):
        """Verify state has messages field"""
        assert "messages" in {AgentName}State.__annotations__


class Test{AgentName}Integration:
    """{AgentName} integration tests"""

    @pytest.mark.asyncio
    async def test_agent_invoke(self):
        """Integration test for agent invocation"""
        agent = {AgentName}()
        graph = agent.build()

        result = await graph.ainvoke(
            {
                "messages": [
                    {"role": "user", "content": "Test query"}
                ]
            },
            config={"configurable": {"model": "openai:gpt-4.1-mini"}}
        )

        assert "messages" in result
        assert len(result["messages"]) > 0
```

## TestAgentClass

Tests for agent class structure and inheritance.

```python
class Test{AgentName}Class:
    """{AgentName} class tests"""

    def test_agent_inherits_base_agent(self):
        """Verify {AgentName} inherits from BaseAgent"""
        from agent.base import BaseAgent
        agent = {AgentName}()
        assert isinstance(agent, BaseAgent)

    def test_agent_initialization(self):
        """Test agent initialization"""
        agent = {AgentName}()
        assert agent is not None

    def test_agent_get_state_schema(self):
        """Verify get_state_schema returns correct type"""
        from langchain.agents import AgentState
        agent = {AgentName}()
        schema = agent.get_state_schema()
        assert schema == AgentState

    def test_agent_get_system_prompt(self):
        """Verify get_system_prompt returns prompt"""
        agent = {AgentName}()
        prompt = agent.get_system_prompt()
        assert prompt == SYSTEM_PROMPT
        assert len(prompt) > 0

    def test_agent_get_tools(self):
        """Verify get_tools returns tool list"""
        agent = {AgentName}()
        tools = agent.get_tools()
        assert isinstance(tools, list)

    def test_agent_build(self):
        """Verify build() returns runnable graph"""
        agent = {AgentName}()
        graph = agent.build()
        assert graph is not None
        assert hasattr(graph, "invoke")
```

## TestAgentTools

Tests for tool functions and invocation.

```python
class Test{AgentName}Tools:
    """{AgentName} tools tests"""

    def test_get_tools_returns_list(self):
        """Verify get_tools returns tool list"""
        tools = get_tools()
        assert isinstance(tools, list)
        assert len(tools) == EXPECTED_TOOL_COUNT

    def test_tool_names(self):
        """Verify expected tools are present"""
        tools = get_tools()
        tool_names = [tool.name for tool in tools]
        assert "expected_tool_1" in tool_names
        assert "expected_tool_2" in tool_names

    def test_tool_invocation_with_params(self):
        """Test tool invocation with parameters"""
        result = tool_name.invoke({
            "required_param": "value",
            "optional_param": "value",
        })
        assert isinstance(result, str)
        assert "expected_content" in result

    def test_tool_invocation_defaults(self):
        """Test tool invocation with default parameters"""
        result = tool_name.invoke({
            "required_param": "value",
        })
        assert isinstance(result, str)
```

## TestAgentConfiguration

Tests for configuration dataclass.

```python
class Test{AgentName}Configuration:
    """{AgentName} configuration tests"""

    def test_configuration_defaults(self):
        """Test configuration default values"""
        config = Configuration()
        assert config.model is not None
        # Add assertions for other default fields

    def test_configuration_custom_values(self):
        """Test configuration with custom values"""
        config = Configuration(
            model="openai:gpt-4.1",
            custom_field="custom_value",
        )
        assert config.model == "openai:gpt-4.1"
        assert config.custom_field == "custom_value"

    def test_configuration_from_runnable_config(self):
        """Test from_runnable_config parsing"""
        runnable_config = {
            "configurable": {
                "model": "anthropic:claude-sonnet-4-5",
                "custom_field": "value",
            }
        }
        config = Configuration.from_runnable_config(runnable_config)
        assert config.model == "anthropic:claude-sonnet-4-5"

    def test_configuration_from_none(self):
        """Test from_runnable_config with None input"""
        config = Configuration.from_runnable_config(None)
        assert config is not None
```

## TestAgentMiddleware

Tests for middleware components.

```python
class Test{AgentName}Middleware:
    """{AgentName} middleware tests"""

    def test_get_middlewares_returns_list(self):
        """Verify get_middlewares returns middleware list"""
        middlewares = get_middlewares()
        assert isinstance(middlewares, list)
        assert len(middlewares) >= 1

    def test_middleware_types(self):
        """Verify middleware types"""
        from agent.{agent_name}.middleware import ConfigurationInjectionMiddleware

        middlewares = get_middlewares()
        middleware_types = [type(m).__name__ for m in middlewares]
        assert "ConfigurationInjectionMiddleware" in middleware_types
```

## TestAgentState

Tests for state schema.

```python
class Test{AgentName}State:
    """{AgentName} state tests"""

    def test_state_has_messages(self):
        """Verify state has messages field"""
        assert "messages" in {AgentName}State.__annotations__

    def test_state_extends_base(self):
        """Verify state extends BaseState"""
        from agent.base import BaseState
        assert issubclass({AgentName}State.__class__, dict)
```

## Integration

Async integration tests for full agent workflow.

```python
class Test{AgentName}Integration:
    """{AgentName} integration tests"""

    @pytest.mark.asyncio
    async def test_agent_invoke(self):
        """Integration test for agent invocation"""
        agent = {AgentName}()
        graph = agent.build()

        result = await graph.ainvoke(
            {
                "messages": [
                    {"role": "user", "content": "Test query"}
                ]
            },
            config={"configurable": {"model": "openai:gpt-4.1-mini"}}
        )

        assert "messages" in result
        assert len(result["messages"]) > 0

    @pytest.mark.asyncio
    async def test_agent_with_specific_task(self):
        """Test agent with specific task"""
        agent = {AgentName}()
        graph = agent.build()

        result = await graph.ainvoke(
            {
                "messages": [
                    {"role": "user", "content": "Specific task description"}
                ]
            },
            config={"configurable": {"model": "openai:gpt-4.1-mini"}}
        )

        assert "messages" in result
        # Add task-specific assertions
```

## Imports Template

Standard imports for test files:

```python
import pytest

from agent.{agent_name} import {AgentName}
from agent.{agent_name}.state import {AgentName}State
from agent.{agent_name}.prompt import SYSTEM_PROMPT
from agent.{agent_name}.tool import (
    get_tools,
    # individual tools...
)
from agent.{agent_name}.configuration import Configuration
from agent.{agent_name}.middleware import get_middlewares
```

## Conftest Requirements

Ensure `conftest.py` includes:

```python
import pytest
from dotenv import load_dotenv

load_dotenv(override=True)

@pytest.fixture(scope="session")
def anyio_backend():
    """anyio backend configuration"""
    return "asyncio"
```

And `pyproject.toml` includes:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```
