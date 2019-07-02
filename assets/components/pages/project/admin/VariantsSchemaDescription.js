import PropTypes from "prop-types";
import React from "react";
import { Label, List } from "semantic-ui-react";

import variantsSchema from "../../../../variants-schema.json";

const renderType = schema => {
  if (schema.type === "array") {
    return `array (${renderType(schema.items)})`;
  }

  if (schema.type === "object") {
    return "object";
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join("|");
  }

  if (schema.enum) {
    return `enum (${schema.enum.map(value => `"${value}"`).join(", ")})`;
  }

  return schema.type;
};

const SchemaDescription = ({ schema }) => {
  const { type } = schema;
  if (type === "array") {
    return <SchemaDescription schema={schema.items} />;
  }

  if (type === "object") {
    return (
      <List bulleted>
        {Object.keys(schema.properties).map(propertyName => {
          const propertySchema = schema.properties[propertyName];
          return (
            <List.Item key={propertyName}>
              <List.Content>
                <List.Header>
                  {propertyName} <Label size="small">{renderType(propertySchema)}</Label>
                  {(schema.required || []).includes(propertyName) && (
                    <Label size="small">required</Label>
                  )}
                </List.Header>
                <List.Description>
                  {propertySchema.description}
                  <SchemaDescription schema={propertySchema} />
                </List.Description>
              </List.Content>
            </List.Item>
          );
        })}
      </List>
    );
  }

  return null;
};

SchemaDescription.propTypes = {
  schema: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

const VariantsSchemaDescription = () => <SchemaDescription schema={variantsSchema} />;

export default VariantsSchemaDescription;
