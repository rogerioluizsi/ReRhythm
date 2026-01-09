"""
Utility module for OpenAI LLM interactions.
Provides shared client initialization and helper functions.
"""
import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Dict, Any, Optional
import json

# Load environment variables
load_dotenv()

# Initialize OpenAI client (shared instance)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def chat_completion(
    messages: List[Dict[str, str]],
    model: str = "gpt-5-mini",
    max_tokens: Optional[int] = None
) -> str:
    """
    Simple chat completion wrapper for OpenAI API.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model name to use
        max_tokens: Maximum tokens in response
    
    Returns:
        The content of the response message
    """
    kwargs = {
        "model": model,
        "messages": messages
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    
    response = client.chat.completions.create(**kwargs)
    
    content = response.choices[0].message.content
    return content.strip() if content else ""


def structured_response(
    messages: List[Dict[str, str]],
    schema: Dict[str, Any],
    schema_name: str,
    model: str = "gpt-5-mini"
) -> Dict[str, Any]:
    """
    Structured output wrapper for OpenAI API with JSON schema validation.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        schema: JSON schema for response validation
        schema_name: Name for the schema
        model: Model name to use
    
    Returns:
        Parsed JSON response matching the schema
    """
    response = client.responses.create(
        model=model,
        input=messages,
        text={
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "strict": True,
                "schema": schema
            }
        }
    )
    
    return json.loads(response.output_text)
