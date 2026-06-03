import json
import re
from app.main import app

def generate_postman_collection():
    openapi = app.openapi()
    
    collection = {
        "info": {
            "_postman_id": "affiliate-dashboard-api-id",
            "name": openapi.get("info", {}).get("title", "Affiliate Dashboard API"),
            "description": openapi.get("info", {}).get("description", "Generated Postman Collection for Affiliate Dashboard API"),
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": [],
        "variable": [
            {
                "key": "baseUrl",
                "value": "http://localhost:8000",
                "type": "string"
            },
            {
                "key": "token",
                "value": "",
                "type": "string"
            }
        ]
    }
    
    # Extract components
    components = openapi.get("components", {})
    schemas = components.get("schemas", {})
    
    def resolve_ref(ref_str):
        if not ref_str:
            return {}
        parts = ref_str.split('/')
        if len(parts) >= 4 and parts[1] == 'components' and parts[2] == 'schemas':
            schema_name = parts[3]
            return schemas.get(schema_name, {})
        return {}

    def get_resolved_schema(schema):
        if not isinstance(schema, dict):
            return schema
        if "$ref" in schema:
            ref_schema = resolve_ref(schema["$ref"])
            # Merge ref_schema details into a copy of schema
            merged = {**ref_schema, **schema}
            merged.pop("$ref", None)
            return get_resolved_schema(merged)
        if "allOf" in schema:
            merged = {}
            for sub in schema["allOf"]:
                resolved_sub = get_resolved_schema(sub)
                if isinstance(resolved_sub, dict):
                    merged.update(resolved_sub)
            return merged
        return schema

    def generate_mock_data(schema):
        schema = get_resolved_schema(schema)
        if not isinstance(schema, dict):
            return None
        
        # Check for default or example first
        if "example" in schema:
            return schema["example"]
        if "default" in schema:
            return schema["default"]
        
        type_ = schema.get("type")
        if not type_:
            # Could be anyOf, oneOf
            if "anyOf" in schema:
                non_null_schemas = [s for s in schema["anyOf"] if isinstance(s, dict) and s.get("type") != "null"]
                if non_null_schemas:
                    return generate_mock_data(non_null_schemas[0])
                return generate_mock_data(schema["anyOf"][0])
            if "oneOf" in schema:
                return generate_mock_data(schema["oneOf"][0])
            if "properties" in schema:
                type_ = "object"
            else:
                return ""

        if type_ == "string":
            if schema.get("format") == "date-time":
                return "2026-05-25T11:00:00Z"
            if schema.get("format") == "date":
                return "2026-05-25"
            if schema.get("format") == "email":
                return "user@example.com"
            return "string"
        elif type_ in ["integer", "number"]:
            return 123 if type_ == "integer" else 12.3
        elif type_ == "boolean":
            return True
        elif type_ == "array":
            items_schema = schema.get("items", {})
            return [generate_mock_data(items_schema)]
        elif type_ == "object":
            obj = {}
            properties = schema.get("properties", {})
            for prop_name, prop_schema in properties.items():
                obj[prop_name] = generate_mock_data(prop_schema)
            return obj
        return None

    # Group requests by tags
    folders = {} # tag_name -> list of items

    paths = openapi.get("paths", {})
    for path, path_item in paths.items():
        # Keep path starting with /api/v1 or / as is, and use {{baseUrl}} as http://localhost:8000
        display_path = path
            
        # Convert path variables: {user_id} -> :user_id
        postman_path_str = display_path
        path_variables = []
        matches = re.findall(r"\{([^}]+)\}", display_path)
        for match in matches:
            postman_path_str = postman_path_str.replace(f"{{{match}}}", f":{match}")
            path_variables.append(match)

        for method, op_item in path_item.items():
            if method.lower() not in ["get", "post", "put", "delete", "patch", "options", "head"]:
                continue
                
            tags = op_item.get("tags", ["General"])
            tag = tags[0] # primary tag
            
            # Request Name
            summary = op_item.get("summary", f"{method.upper()} {display_path}")
            description = op_item.get("description", "")
            
            # Parameters (query parameters and path variables)
            query_params = []
            url_variables = []
            
            # Check security / authentication for this route
            has_auth = "security" in op_item and len(op_item["security"]) > 0
            
            # Extract parameters
            params = op_item.get("parameters", [])
            for param in params:
                param = get_resolved_schema(param)
                name = param.get("name")
                in_ = param.get("in")
                required = param.get("required", False)
                desc = param.get("description", "")
                param_schema = param.get("schema", {})
                default_val = param_schema.get("default", "")
                
                if in_ == "query":
                    query_params.append({
                        "key": name,
                        "value": str(default_val) if default_val != "" else "",
                        "description": desc,
                        "disabled": not required
                    })
                elif in_ == "path":
                    # Path variables
                    url_variables.append({
                        "key": name,
                        "value": str(default_val) if default_val != "" else f":{name}",
                        "description": desc
                    })
                    
            # For path variables not explicitly defined in openapi parameters, add placeholder
            for pv in path_variables:
                if not any(v["key"] == pv for v in url_variables):
                    url_variables.append({
                        "key": pv,
                        "value": "",
                        "description": f"Path variable {pv}"
                    })

            # Request Body
            request_body_obj = None
            req_body = op_item.get("requestBody")
            if req_body:
                req_body = get_resolved_schema(req_body)
                content = req_body.get("content", {})
                
                if "application/json" in content:
                    json_schema = content["application/json"].get("schema", {})
                    mock_json = generate_mock_data(json_schema)
                    request_body_obj = {
                        "mode": "raw",
                        "raw": json.dumps(mock_json, indent=2),
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    }
                elif "application/x-www-form-urlencoded" in content:
                    form_schema = content["application/x-www-form-urlencoded"].get("schema", {})
                    form_schema = get_resolved_schema(form_schema)
                    form_data = []
                    properties = form_schema.get("properties", {})
                    required_props = form_schema.get("required", [])
                    for k, v in properties.items():
                        v = get_resolved_schema(v)
                        default_val = v.get("default", "")
                        if k == "username":
                            default_val = "affiliate@example.com"
                        elif k == "password":
                            default_val = "password123"
                        form_data.append({
                            "key": k,
                            "value": str(default_val),
                            "description": v.get("description", ""),
                            "type": "text",
                            "disabled": k not in required_props
                        })
                    request_body_obj = {
                        "mode": "urlencoded",
                        "urlencoded": form_data
                    }
                elif "multipart/form-data" in content:
                    form_schema = content["multipart/form-data"].get("schema", {})
                    form_schema = get_resolved_schema(form_schema)
                    form_data = []
                    properties = form_schema.get("properties", {})
                    required_props = form_schema.get("required", [])
                    for k, v in properties.items():
                        v = get_resolved_schema(v)
                        is_file = v.get("format") == "binary" or (isinstance(v.get("type"), str) and v.get("format") == "binary")
                        form_data.append({
                            "key": k,
                            "value": str(v.get("default", "")) if not is_file else "",
                            "description": v.get("description", ""),
                            "type": "file" if is_file else "text",
                            "disabled": k not in required_props
                        })
                    request_body_obj = {
                        "mode": "formdata",
                        "formdata": form_data
                    }

            # Headers
            headers = []
            if has_auth:
                headers.append({
                    "key": "Authorization",
                    "value": "Bearer {{token}}",
                    "type": "text"
                })
            
            # Postman Request Object
            path_parts = [p for p in postman_path_str.split('/') if p]
            postman_req = {
                "name": summary,
                "request": {
                    "method": method.upper(),
                    "header": headers,
                    "url": {
                        "raw": "{{baseUrl}}" + postman_path_str,
                        "host": ["{{baseUrl}}"],
                        "path": path_parts
                    },
                    "description": description
                },
                "response": []
            }
            
            if query_params:
                postman_req["request"]["url"]["query"] = query_params
            if url_variables:
                postman_req["request"]["url"]["variable"] = url_variables
            if request_body_obj:
                postman_req["request"]["body"] = request_body_obj

            if tag not in folders:
                folders[tag] = []
            folders[tag].append(postman_req)

    # Add folders to collection items
    for tag, items in sorted(folders.items()):
        collection["item"].append({
            "name": tag.capitalize(),
            "item": items
        })

    # Save to file
    output_filename = "Affiliate_Dashboard_API.postman_collection.json"
    with open(output_filename, "w") as f:
        json.dump(collection, f, indent=2)
    print(f"Postman collection successfully generated: {output_filename}")

if __name__ == "__main__":
    generate_postman_collection()
