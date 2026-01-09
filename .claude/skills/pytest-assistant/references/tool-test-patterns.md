# Tool Test Patterns Reference

## Table of Contents
- [Tools Structure](#tools-structure)
- [Full Template](#full-template)
- [Schema Tests](#schema-tests)
- [Initialization Tests](#initialization-tests)
- [Functional Tests](#functional-tests)
- [Error Handling Tests](#error-handling-tests)
- [Integration Tests](#integration-tests)

## Tools Structure

```
tools/
├── __init__.py
├── time.py          # get_current_time
├── search.py        # tavily_search, tavily_search_context, tavily_qna_search
├── vector.py        # vector_search, vector_search_context, initialize_vector_store
├── public_data.py   # Configuration/keys
└── kis/             # Korean stock trading tools (11 tools)
    ├── schemas.py       # Pydantic input schemas
    ├── client.py        # Lazy-init client functions
    ├── resolver.py      # TickerResolver class
    ├── stock_info.py    # kis_stock_detail_info, kis_stock_previous_info
    ├── market_info.py   # get_orderbook_info, get_market_hours
    ├── account_info.py  # get_user_account_balance, get_user_profits, get_user_daily_orders
    └── trading.py       # buy/sell market/choice price (4 tools)
```

## Full Template

```python
"""Test module for {ToolModule} Tools

Tests for verifying {ToolModule} tool functionality.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from tools.{module} import (
    tool_name_1,
    tool_name_2,
    initialize_function,  # if exists
)
from tools.{module}.schemas import InputSchema  # if exists


class Test{ToolModule}Schema:
    """{ToolModule} input schema tests"""

    def test_schema_required_fields(self):
        """Verify required fields are enforced"""
        schema = InputSchema(required_field="value")
        assert schema.required_field == "value"

    def test_schema_default_values(self):
        """Verify default values are set correctly"""
        schema = InputSchema(required_field="value")
        assert schema.optional_field == "default_value"

    def test_schema_validation(self):
        """Verify field validation works"""
        with pytest.raises(ValueError):
            InputSchema(invalid_field="bad_value")


class Test{ToolModule}Initialization:
    """{ToolModule} initialization tests"""

    def test_lazy_initialization(self):
        """Verify lazy initialization pattern"""
        # First call initializes
        result1 = get_client()
        # Second call returns same instance
        result2 = get_client()
        assert result1 is result2

    def test_manual_initialization(self):
        """Verify manual override works"""
        mock_client = Mock()
        initialize_client(mock_client)
        assert get_client() is mock_client

    def test_fallback_chain(self):
        """Verify fallback when primary fails"""
        with patch("tools.module.primary_init", side_effect=Exception):
            client = get_client()
            assert client is not None  # Falls back to secondary


class Test{ToolModule}Functional:
    """{ToolModule} functional tests"""

    def test_tool_invocation(self):
        """Test basic tool invocation"""
        result = tool_name.invoke({
            "param1": "value1",
            "param2": "value2",
        })
        assert isinstance(result, expected_type)

    def test_tool_with_defaults(self):
        """Test tool with default parameters"""
        result = tool_name.invoke({
            "required_param": "value",
        })
        assert isinstance(result, expected_type)

    def test_tool_return_format(self):
        """Verify return format structure"""
        result = tool_name.invoke({"query": "test"})
        assert "expected_key" in result


class Test{ToolModule}ErrorHandling:
    """{ToolModule} error handling tests"""

    def test_error_dict_format(self):
        """Verify error returns proper dict format"""
        with patch("tools.module.dependency", side_effect=Exception("Test error")):
            result = tool_name.invoke({"query": "test"})
            assert "error" in result
            assert "details" in result
            assert "message" in result

    def test_invalid_input_handling(self):
        """Test handling of invalid inputs"""
        result = tool_name.invoke({"invalid_param": None})
        assert "error" in result


class Test{ToolModule}Integration:
    """{ToolModule} integration tests"""

    @pytest.mark.asyncio
    async def test_tool_chain(self):
        """Test multiple tools working together"""
        result1 = await tool_1.ainvoke({"query": "test"})
        result2 = await tool_2.ainvoke({"input": result1})
        assert result2 is not None
```

## Schema Tests

Test Pydantic input schemas for validation.

```python
class TestVectorSearchInput:
    """VectorSearchInput schema tests"""

    def test_schema_required_query(self):
        """Verify query field is required"""
        from tools.vector import VectorSearchInput
        schema = VectorSearchInput(query="test query")
        assert schema.query == "test query"

    def test_schema_k_default(self):
        """Verify k has correct default value"""
        from tools.vector import VectorSearchInput
        schema = VectorSearchInput(query="test")
        assert schema.k == 5  # default

    def test_schema_k_bounds(self):
        """Verify k respects ge=1, le=20 bounds"""
        from tools.vector import VectorSearchInput
        from pydantic import ValidationError

        # Valid bounds
        schema = VectorSearchInput(query="test", k=1)
        assert schema.k == 1

        schema = VectorSearchInput(query="test", k=20)
        assert schema.k == 20

        # Invalid bounds
        with pytest.raises(ValidationError):
            VectorSearchInput(query="test", k=0)

        with pytest.raises(ValidationError):
            VectorSearchInput(query="test", k=21)
```

## Initialization Tests

Test lazy initialization and fallback patterns.

```python
class TestVectorStoreInitialization:
    """Vector store initialization tests"""

    def test_get_vector_store_lazy_init(self):
        """Verify lazy initialization"""
        from tools.vector import get_vector_store, _vector_store

        # Reset state
        import tools.vector as vector_module
        vector_module._vector_store = None

        store = get_vector_store()
        assert store is not None

    def test_initialize_vector_store_override(self):
        """Verify manual override works"""
        from tools.vector import initialize_vector_store, get_vector_store
        from unittest.mock import Mock

        mock_store = Mock()
        initialize_vector_store(mock_store)
        assert get_vector_store() is mock_store

    def test_embeddings_fallback_chain(self):
        """Verify Bedrock -> OpenAI -> FakeEmbeddings fallback"""
        # Test when Bedrock fails, falls back to OpenAI
        # Test when OpenAI fails, falls back to FakeEmbeddings
        pass
```

## Functional Tests

Test tool invocation and return values.

```python
class TestVectorSearchTool:
    """vector_search tool tests"""

    def test_vector_search_basic(self):
        """Test basic vector search"""
        from tools.vector import vector_search

        result = vector_search.invoke({
            "query": "LangGraph workflow",
            "k": 3,
        })

        assert isinstance(result, list)
        assert len(result) <= 3

    def test_vector_search_result_format(self):
        """Verify result contains required fields"""
        from tools.vector import vector_search

        result = vector_search.invoke({"query": "test", "k": 1})

        if result:  # If results exist
            item = result[0]
            assert "content" in item
            assert "metadata" in item
            assert "score" in item

    def test_vector_search_context_formatting(self):
        """Test context formatting tool"""
        from tools.vector import vector_search_context

        result = vector_search_context.invoke({
            "query": "test query",
            "k": 2,
        })

        assert isinstance(result, str)


class TestTimeTool:
    """get_current_time tool tests"""

    def test_time_format(self):
        """Verify time format: YYYY-MM-DD HH:MM:SS"""
        from tools.time import get_current_time
        import re

        result = get_current_time.invoke({})
        pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}"
        assert re.match(pattern, result)


class TestSearchTools:
    """Tavily search tools tests"""

    def test_tavily_search_basic(self):
        """Test basic Tavily search"""
        from tools.search import tavily_search

        result = tavily_search.invoke({
            "query": "Python programming",
            "max_results": 3,
        })

        assert isinstance(result, dict)

    def test_tavily_search_max_results_bounds(self):
        """Verify max_results respects 1-20 bounds"""
        from tools.search import tavily_search

        result = tavily_search.invoke({
            "query": "test",
            "max_results": 1,
        })
        assert len(result.get("results", [])) <= 1
```

## Error Handling Tests

Test error dict returns and exception handling.

```python
class TestToolErrorHandling:
    """Tool error handling tests"""

    def test_vector_search_no_store_error(self):
        """Test error when vector store not initialized"""
        from tools.vector import vector_search
        import tools.vector as vector_module

        # Reset store
        vector_module._vector_store = None

        result = vector_search.invoke({"query": "test"})

        # Should return error dict, not raise
        assert "error" in result or isinstance(result, list)

    def test_tavily_missing_api_key_error(self):
        """Test error when API key missing"""
        from tools.search import tavily_search
        from unittest.mock import patch

        with patch.dict("os.environ", {"TAVILY_API_KEY": ""}):
            result = tavily_search.invoke({"query": "test"})
            # Verify graceful error handling
            assert result is not None

    def test_kis_connection_error_retry(self):
        """Test retry decorator on connection errors"""
        from tools.kis.retry import retry_on_connection_error
        from requests.exceptions import ConnectionError

        call_count = 0

        @retry_on_connection_error(max_retries=3, initial_delay=0.01)
        def failing_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ConnectionError("Test error")
            return "success"

        result = failing_func()
        assert result == "success"
        assert call_count == 3
```

## Integration Tests

Test tool chaining and real-world scenarios.

```python
class TestToolIntegration:
    """Tool integration tests"""

    @pytest.mark.asyncio
    async def test_search_then_vector_store(self):
        """Test search results into vector store"""
        from tools.search import tavily_search
        from tools.vector import vector_search

        # Search for content
        search_result = tavily_search.invoke({
            "query": "LangGraph tutorial",
            "max_results": 2,
        })

        # Query related content from vector store
        vector_result = vector_search.invoke({
            "query": "LangGraph tutorial",
            "k": 3,
        })

        # Both should return results
        assert search_result is not None
        assert vector_result is not None


class TestKISToolIntegration:
    """KIS stock trading tool integration tests"""

    def test_stock_info_workflow(self):
        """Test stock info retrieval workflow"""
        from tools.kis import kis_stock_detail_info

        result = kis_stock_detail_info.invoke({
            "query": "삼성전자 현재가 알려줘",
        })

        assert isinstance(result, dict)

    def test_simulation_mode_safety(self):
        """CRITICAL: Verify simulation mode prevents real trades"""
        from tools.kis.trading import SIMULATION_MODE

        # Simulation mode should be True by default
        assert SIMULATION_MODE is True

    def test_ticker_resolution_chain(self):
        """Test Korean name -> ticker resolution"""
        from tools.kis.resolver import get_ticker_resolver

        resolver = get_ticker_resolver()
        # Should resolve Korean stock names
        # e.g., "삼성전자" -> "005930"
```

## Imports Template

Standard imports for tool test files:

```python
import pytest
from unittest.mock import Mock, patch, MagicMock

from tools.{module} import (
    tool_function_1,
    tool_function_2,
    initialize_function,
    get_client,
)

# For schema tests
from tools.{module}.schemas import (
    InputSchema1,
    InputSchema2,
)

# For KIS tools
from tools.kis import (
    kis_stock_detail_info,
    kis_stock_previous_info,
    get_orderbook_info,
    get_market_hours,
    get_user_account_balance,
    # ... etc
)
```

## Test File Naming

- Tool module tests: `tests/test_{module}_tools.py`
- Examples:
  - `tests/test_vector_tools.py`
  - `tests/test_search_tools.py`
  - `tests/test_kis_tools.py`
