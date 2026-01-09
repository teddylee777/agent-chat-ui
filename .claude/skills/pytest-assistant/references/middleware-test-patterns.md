# Middleware Test Patterns Reference

## Table of Contents
- [Middleware Structure](#middleware-structure)
- [Full Template](#full-template)
- [Initialization Tests](#initialization-tests)
- [Sync Hook Tests](#sync-hook-tests)
- [Async Hook Tests](#async-hook-tests)
- [Context Tests](#context-tests)
- [Integration Tests](#integration-tests)

## Middleware Structure

```
middleware/
├── __init__.py          # Exports: ConfigurationInjectionMiddleware, MemoriContext, MemoriMiddleware
├── configuration.py     # ConfigurationInjectionMiddleware
└── memori.py            # MemoriMiddleware, MemoriContext (dataclass)
```

### Middleware Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `ConfigurationInjectionMiddleware` | Runtime model configuration | `wrap_model_call`, `awrap_model_call` |
| `MemoriMiddleware` | Local memory system | `before_model`, `after_model`, `abefore_model`, `aafter_model` |
| `MemoriContext` | Context schema (dataclass) | `entity_id`, `process_id` |

## Full Template

```python
"""Test module for {MiddlewareName} Middleware

Tests for verifying {MiddlewareName} middleware functionality.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from dataclasses import dataclass

from middleware import (
    ConfigurationInjectionMiddleware,
    MemoriMiddleware,
    MemoriContext,
)


class Test{MiddlewareName}Initialization:
    """{MiddlewareName} initialization tests"""

    def test_middleware_creation(self):
        """Verify middleware can be instantiated"""
        middleware = {MiddlewareName}()
        assert middleware is not None

    def test_middleware_with_parameters(self):
        """Verify middleware accepts parameters"""
        middleware = {MiddlewareName}(
            param1="value1",
            param2="value2",
        )
        assert middleware.param1 == "value1"


class Test{MiddlewareName}SyncHooks:
    """{MiddlewareName} synchronous hook tests"""

    def test_wrap_model_call(self):
        """Test synchronous model call wrapping"""
        middleware = {MiddlewareName}()

        mock_request = Mock()
        mock_handler = Mock(return_value="result")

        result = middleware.wrap_model_call(mock_request, mock_handler)

        assert result == "result"
        mock_handler.assert_called_once()

    def test_before_model(self):
        """Test before_model hook"""
        middleware = {MiddlewareName}()

        mock_state = {"messages": [...]}
        result = middleware.before_model(mock_state)

        # Returns modified state or None
        assert result is None or isinstance(result, dict)

    def test_after_model(self):
        """Test after_model hook"""
        middleware = {MiddlewareName}()

        mock_state = {"messages": [...]}
        result = middleware.after_model(mock_state)

        assert result is None or isinstance(result, dict)


class Test{MiddlewareName}AsyncHooks:
    """{MiddlewareName} asynchronous hook tests"""

    @pytest.mark.asyncio
    async def test_awrap_model_call(self):
        """Test async model call wrapping"""
        middleware = {MiddlewareName}()

        mock_request = Mock()
        mock_handler = AsyncMock(return_value="result")

        result = await middleware.awrap_model_call(mock_request, mock_handler)

        assert result == "result"

    @pytest.mark.asyncio
    async def test_abefore_model(self):
        """Test async before_model hook"""
        middleware = {MiddlewareName}()

        mock_state = {"messages": [...]}
        result = await middleware.abefore_model(mock_state)

        assert result is None or isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_aafter_model(self):
        """Test async after_model hook"""
        middleware = {MiddlewareName}()

        mock_state = {"messages": [...]}
        result = await middleware.aafter_model(mock_state)

        assert result is None or isinstance(result, dict)


class Test{MiddlewareName}Context:
    """{MiddlewareName} runtime context tests"""

    def test_context_from_runtime(self):
        """Test context extraction from runtime"""
        middleware = {MiddlewareName}()

        mock_runtime = Mock()
        mock_runtime.context = Mock(field="value")

        # Verify context is used
        pass

    def test_context_fallback(self):
        """Test fallback when context missing"""
        middleware = {MiddlewareName}(default_value="fallback")

        # Verify fallback is used when context not provided
        pass


class Test{MiddlewareName}Integration:
    """{MiddlewareName} integration tests"""

    @pytest.mark.asyncio
    async def test_with_agent(self):
        """Test middleware with full agent"""
        from langchain.agents import create_agent

        middleware = {MiddlewareName}()

        agent = create_agent(
            model="openai:gpt-4o-mini",
            tools=[],
            middleware=[middleware],
        )

        result = await agent.ainvoke({
            "messages": [{"role": "user", "content": "test"}]
        })

        assert "messages" in result
```

## Initialization Tests

Test middleware instantiation and configuration.

```python
class TestConfigurationInjectionMiddlewareInit:
    """ConfigurationInjectionMiddleware initialization tests"""

    def test_basic_creation(self):
        """Verify basic middleware creation"""
        from middleware import ConfigurationInjectionMiddleware

        middleware = ConfigurationInjectionMiddleware()
        assert middleware is not None

    def test_inherits_agent_middleware(self):
        """Verify inheritance from AgentMiddleware"""
        from middleware import ConfigurationInjectionMiddleware
        from langchain.agents.middleware import AgentMiddleware

        middleware = ConfigurationInjectionMiddleware()
        assert isinstance(middleware, AgentMiddleware)


class TestMemoriMiddlewareInit:
    """MemoriMiddleware initialization tests"""

    def test_with_entity_id(self):
        """Verify initialization with fixed entity_id"""
        from middleware import MemoriMiddleware

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            entity_id="user-123",
        )
        assert middleware.entity_id == "user-123"

    def test_without_entity_id(self):
        """Verify initialization without entity_id (runtime context mode)"""
        from middleware import MemoriMiddleware

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
        )
        assert middleware.entity_id is None


class TestMemoriContextDataclass:
    """MemoriContext dataclass tests"""

    def test_required_entity_id(self):
        """Verify entity_id is required"""
        from middleware import MemoriContext

        context = MemoriContext(entity_id="user-123")
        assert context.entity_id == "user-123"

    def test_optional_process_id(self):
        """Verify process_id is optional with None default"""
        from middleware import MemoriContext

        context = MemoriContext(entity_id="user-123")
        assert context.process_id is None

        context_with_process = MemoriContext(
            entity_id="user-123",
            process_id="app-1",
        )
        assert context_with_process.process_id == "app-1"
```

## Sync Hook Tests

Test synchronous middleware hooks.

```python
class TestConfigurationInjectionSyncHooks:
    """ConfigurationInjectionMiddleware sync hook tests"""

    def test_wrap_model_call_injects_model(self):
        """Verify model is injected from context"""
        from middleware import ConfigurationInjectionMiddleware
        from unittest.mock import Mock

        middleware = ConfigurationInjectionMiddleware()

        # Create mock request with context
        mock_request = Mock()
        mock_request.runtime.context.model = "anthropic:claude-haiku-4-5"
        mock_request.override = Mock(return_value=mock_request)

        mock_handler = Mock(return_value="result")

        result = middleware.wrap_model_call(mock_request, mock_handler)

        # Verify override was called with new model
        mock_request.override.assert_called()

    def test_wrap_model_call_passthrough_no_context(self):
        """Verify passthrough when no context model"""
        from middleware import ConfigurationInjectionMiddleware

        middleware = ConfigurationInjectionMiddleware()

        mock_request = Mock()
        mock_request.runtime.context = None

        mock_handler = Mock(return_value="result")

        result = middleware.wrap_model_call(mock_request, mock_handler)

        assert result == "result"


class TestMemoriMiddlewareSyncHooks:
    """MemoriMiddleware sync hook tests"""

    def test_before_model_enhances_message(self):
        """Verify before_model adds fact context to user message"""
        from middleware import MemoriMiddleware
        from langchain_core.messages import HumanMessage

        mock_memori = Mock()
        mock_memori.recall.return_value = ["Fact 1", "Fact 2"]

        middleware = MemoriMiddleware(
            memori=mock_memori,
            conn_factory=Mock(),
            entity_id="user-123",
        )

        state = {
            "messages": [HumanMessage(content="What did we discuss?")]
        }

        result = middleware.before_model(state)

        # Should return modified state with enhanced message
        if result:
            assert "Fact 1" in str(result)

    def test_before_model_handles_no_facts(self):
        """Verify graceful handling when no facts found"""
        from middleware import MemoriMiddleware
        from langchain_core.messages import HumanMessage

        mock_memori = Mock()
        mock_memori.recall.return_value = []

        middleware = MemoriMiddleware(
            memori=mock_memori,
            conn_factory=Mock(),
            entity_id="user-123",
        )

        state = {
            "messages": [HumanMessage(content="Hello")]
        }

        result = middleware.before_model(state)

        # Should return None (no modification) or state unchanged
        assert result is None or result == state

    def test_after_model_extracts_facts(self):
        """Verify after_model extracts and saves facts"""
        from middleware import MemoriMiddleware
        from langchain_core.messages import AIMessage

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            entity_id="user-123",
        )

        state = {
            "messages": [AIMessage(content="The user prefers dark mode.")]
        }

        with patch.object(middleware, "_extract_and_save_facts") as mock_extract:
            result = middleware.after_model(state)
            mock_extract.assert_called()
```

## Async Hook Tests

Test asynchronous middleware hooks.

```python
class TestConfigurationInjectionAsyncHooks:
    """ConfigurationInjectionMiddleware async hook tests"""

    @pytest.mark.asyncio
    async def test_awrap_model_call_injects_model(self):
        """Verify async model injection"""
        from middleware import ConfigurationInjectionMiddleware

        middleware = ConfigurationInjectionMiddleware()

        mock_request = Mock()
        mock_request.runtime.context.model = "openai:gpt-4o"
        mock_request.override = Mock(return_value=mock_request)

        mock_handler = AsyncMock(return_value="result")

        result = await middleware.awrap_model_call(mock_request, mock_handler)

        assert result == "result"
        mock_handler.assert_called_once()


class TestMemoriMiddlewareAsyncHooks:
    """MemoriMiddleware async hook tests"""

    @pytest.mark.asyncio
    async def test_abefore_model(self):
        """Test async before_model hook"""
        from middleware import MemoriMiddleware
        from langchain_core.messages import HumanMessage

        mock_memori = Mock()
        mock_memori.recall = AsyncMock(return_value=["Async Fact"])

        middleware = MemoriMiddleware(
            memori=mock_memori,
            conn_factory=Mock(),
            entity_id="user-123",
        )

        state = {
            "messages": [HumanMessage(content="Test")]
        }

        result = await middleware.abefore_model(state)

        # Verify recall was called
        mock_memori.recall.assert_called()

    @pytest.mark.asyncio
    async def test_aafter_model(self):
        """Test async after_model hook"""
        from middleware import MemoriMiddleware
        from langchain_core.messages import AIMessage

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            entity_id="user-123",
        )

        state = {
            "messages": [AIMessage(content="Response with facts")]
        }

        with patch.object(middleware, "_aextract_and_save_facts", new_callable=AsyncMock):
            result = await middleware.aafter_model(state)
            # Should call async extraction
```

## Context Tests

Test runtime context handling.

```python
class TestMiddlewareContext:
    """Middleware runtime context tests"""

    def test_entity_id_from_runtime_context(self):
        """Verify entity_id is taken from runtime context"""
        from middleware import MemoriMiddleware, MemoriContext

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            # No default entity_id
        )

        # Simulate runtime with context
        mock_runtime = Mock()
        mock_runtime.context = MemoriContext(entity_id="runtime-user")

        entity_id = middleware._get_entity_id(mock_runtime)
        assert entity_id == "runtime-user"

    def test_entity_id_fallback_to_default(self):
        """Verify fallback to default entity_id"""
        from middleware import MemoriMiddleware

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            entity_id="default-user",
        )

        # No runtime context
        entity_id = middleware._get_entity_id(None)
        assert entity_id == "default-user"

    def test_entity_id_error_when_missing(self):
        """Verify error when no entity_id available"""
        from middleware import MemoriMiddleware

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            # No entity_id
        )

        with pytest.raises(ValueError):
            middleware._get_entity_id(None)

    def test_process_id_optional(self):
        """Verify process_id is optional"""
        from middleware import MemoriMiddleware, MemoriContext

        middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            entity_id="user",
        )

        # Without process_id
        process_id = middleware._get_process_id(None)
        assert process_id is None

        # With process_id in context
        mock_runtime = Mock()
        mock_runtime.context = MemoriContext(
            entity_id="user",
            process_id="app-1",
        )

        process_id = middleware._get_process_id(mock_runtime)
        assert process_id == "app-1"
```

## Integration Tests

Test middleware with full agent pipeline.

```python
class TestMiddlewareIntegration:
    """Middleware integration tests"""

    @pytest.mark.asyncio
    async def test_configuration_middleware_with_agent(self):
        """Test ConfigurationInjectionMiddleware with agent"""
        from middleware import ConfigurationInjectionMiddleware
        from langchain.agents import create_agent
        from dataclasses import dataclass

        @dataclass
        class TestContext:
            model: str = "openai:gpt-4o-mini"

        middleware = ConfigurationInjectionMiddleware()

        agent = create_agent(
            model="openai:gpt-3.5-turbo",  # Default model
            tools=[],
            system_prompt="You are a test agent",
            middleware=[middleware],
            context_schema=TestContext,
        )

        # Invoke with different model in context
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": "Hello"}]},
            context=TestContext(model="anthropic:claude-haiku-4-5"),
        )

        assert "messages" in result

    @pytest.mark.asyncio
    async def test_memori_middleware_with_agent(self):
        """Test MemoriMiddleware with agent"""
        from middleware import MemoriMiddleware, MemoriContext
        from langchain.agents import create_agent

        mock_memori = Mock()
        mock_memori.recall.return_value = []

        middleware = MemoriMiddleware(
            memori=mock_memori,
            conn_factory=Mock(),
        )

        agent = create_agent(
            model="openai:gpt-4o-mini",
            tools=[],
            system_prompt="You are a test agent",
            middleware=[middleware],
            context_schema=MemoriContext,
        )

        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": "Remember this"}]},
            context=MemoriContext(entity_id="test-user"),
        )

        assert "messages" in result

    @pytest.mark.asyncio
    async def test_multiple_middlewares(self):
        """Test multiple middlewares together"""
        from middleware import ConfigurationInjectionMiddleware, MemoriMiddleware
        from langchain.agents import create_agent

        config_middleware = ConfigurationInjectionMiddleware()
        memori_middleware = MemoriMiddleware(
            memori=Mock(),
            conn_factory=Mock(),
            entity_id="user",
        )

        agent = create_agent(
            model="openai:gpt-4o-mini",
            tools=[],
            middleware=[config_middleware, memori_middleware],
        )

        result = await agent.ainvoke({
            "messages": [{"role": "user", "content": "Test"}]
        })

        assert result is not None

    def test_middleware_error_resilience(self):
        """Verify middleware errors don't break agent"""
        from middleware import MemoriMiddleware
        from langchain_core.messages import HumanMessage

        mock_memori = Mock()
        mock_memori.recall.side_effect = Exception("DB error")

        middleware = MemoriMiddleware(
            memori=mock_memori,
            conn_factory=Mock(),
            entity_id="user",
        )

        state = {"messages": [HumanMessage(content="Test")]}

        # Should not raise, just print warning
        result = middleware.before_model(state)

        # Agent continues despite middleware error
        assert result is None  # No modification due to error
```

## Imports Template

Standard imports for middleware test files:

```python
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from dataclasses import dataclass

from middleware import (
    ConfigurationInjectionMiddleware,
    MemoriMiddleware,
    MemoriContext,
)

from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import HumanMessage, AIMessage

# For integration tests
from langchain.agents import create_agent
```

## Test File Naming

- Middleware tests: `tests/test_middleware.py`
- Or split by type:
  - `tests/test_configuration_middleware.py`
  - `tests/test_memori_middleware.py`
