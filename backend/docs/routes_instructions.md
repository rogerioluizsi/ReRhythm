1. Authentication & Account

Managing anonymous sessions or logged-in users.
Name: POST /auth/login
Description: Creates a session. If no credentials are provided, it creates an anonymous "guest" user. If provided, it performs a traditional login.
Input: { device_id, email (optional), password (optional) }
Output: { token (JWT), user_id, is_anonymous (boolean) }
Name: DELETE /account/wipe
Description: The "Panic Button." Permanently deletes the account and all associated records from the database immediately.
Input: { user_id }
Output: { success: true, message: "All data deleted" }
2. The AI Core (Check-in & Recommendation)
Name: POST /check-in/analyze
Description: Frontend sends check-in data, if user has wearable data registered in the daataset, both will be combined and. This is sent to the LLM  together with interventions metadata (name,category, trigger_case ) with a system prompt to (1) remove sensitive data (names/dates) in the response obrigatory, (2) read synced wearable information if existent and checkin information and interventions metadata (3) pick the best set of  interventions from library. 
Input: { check-in data (json) }
Output example:
{
  "recommended_intervention_ids": "1", "2" // IDs from library
  "ai_reasoning": "You seem to be ruminating on an error. Let's focus on physiology first."Cleaned by LLM (without any sensitive data)
}
Name: POST /user/wearable
Description: Saves or updates the user's latest wearable data to their profile (anonymous or not).
Input:
{ user_id, wearable_data }
Output:
{ success: true }
Name: GET /user/wearable/view
Description: Extract user wearable information from user's records, use LLM to summarize information based on user_id.
Input:
{ user_id }
Output:
[ { date, wearable_data_summary } ]


3. Content Library
Name: GET /interventions
Description: Lists all available interventions in the app for manual browsing. 
Input: { category_filter (optional - e.g., "rapid", "sleep") }
Output: [ { id, title, short_description, duration_seconds, category } ]
Name: GET /interventions/{id}
Description: Gets the full details of a specific intervention 
Input: intervention_id
Output: { id, title, full_instructions }
Name: POST  /interventions/{id}
Description: set if times intervention was completed by user
Input: user_id, intervention_id, times


4. Journal registration

Where the user views the past, if they want to.
Name: POST  /journal/create
Description: register a new journal
Input: { user_id, journal description, date expiration(7 days, 30 day, delete_manually)  }
Name: GET /journal/history
Description: Returns past journals.
Input: { user_id }
Output: [ { date, journal, expir} ]
Name: DELETE /journal/entry/{id}
Description: Allows the user to delete a specific record from their history.
Input: entry_id
Output: { success: true }