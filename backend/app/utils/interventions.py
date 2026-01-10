import json
from typing import List, Optional, Dict

INTERVENTIONS_FILE = "interventions_library.json"


def load_interventions() -> List[Dict]:
    """Load all interventions from JSON file"""
    try:
        with open(INTERVENTIONS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    except Exception as e:
        print(f"Error loading interventions: {e}")
        return []


def get_intervention_by_id(intervention_id: str) -> Optional[Dict]:
    """Get a specific intervention by ID"""
    interventions = load_interventions()
    for intervention in interventions:
        if str(intervention.get('id')) == str(intervention_id):
            return intervention
    return None


def get_interventions_by_context(context: str) -> List[Dict]:
    """Filter interventions by context"""
    interventions = load_interventions()
    return [i for i in interventions if i.get('context', '').lower() == context.lower()]


def search_interventions(query: str = None, context: str = None) -> List[Dict]:
    """Search interventions with optional filters"""
    interventions = load_interventions()
    
    if context:
        interventions = [i for i in interventions if context.lower() in i.get('context', '').lower()]
    
    if query:
        interventions = [
            i for i in interventions 
            if query.lower() in i.get('name', '').lower() 
            or query.lower() in i.get('trigger_case', '').lower()
        ]
    
    return interventions


def format_intervention_summary(intervention: Dict) -> Dict:
    """Format intervention for list view"""
    return {
        "id": str(intervention.get('id')),
        "title": intervention.get('name'),
        "short_description": intervention.get('trigger_case'),
        "duration_min": intervention.get('duration_min'),
        "context": intervention.get('context'),
        "modality": intervention.get('modality'),
        "goal_tags": intervention.get('goal_tags', [])
    }


def format_intervention_detail(intervention: Dict) -> Dict:
    """Format intervention for detail view"""
    steps = intervention.get('steps', [])
    full_instructions = "\n".join([f"{i+1}. {step}" for i, step in enumerate(steps)])
    
    return {
        "id": str(intervention.get('id')),
        "title": intervention.get('name'),
        "full_instructions": full_instructions,
        "target_outcome": intervention.get('target_outcome'),
        "duration_min": intervention.get('duration_min'),
        "context": intervention.get('context'),
        "modality": intervention.get('modality'),
        "stress_range": intervention.get('stress_range'),
        "goal_tags": intervention.get('goal_tags', [])
    }


def parse_duration(estimated_time: str) -> int:
    """Convert estimated time string to seconds"""
    if 's' in estimated_time:
        return int(estimated_time.replace('s', ''))
    elif 'm' in estimated_time:
        return int(estimated_time.replace('m', '')) * 60
    return 0
