"""
Utility module for OpenAI LLM interactions.
Provides shared client initialization and helper functions.
"""
import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Dict, Any
import json

# Load environment variables
load_dotenv()

# Initialize OpenAI client (shared instance)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
