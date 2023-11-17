import React from "react";
import { Link } from "react-router-dom";
import { Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import Fetch from "../../Fetch";
import VariantId from "../../VariantId";
import Page from "../Page";
import VariantSearch from "./VariantSearch";

const VariantsPage = () => {
  return (
    <Page>
      <DocumentTitle title="Variants" />
      <Header as="h1" dividing>
        Variants
      </Header>

      <VariantSearch />

      <Fetch path="/variants/">
        {({ data: { variants } }) => {
          return (
            <React.Fragment>
              {variants.length > 0 ? (
                <React.Fragment>
                  <Item.Group>
                    {variants.map(variant => (
                      <Item key={variant.variant_id}>
                        <Item.Content>
                          <Item.Header>
                            <Link
                              to={`/variant/${variant.variant_id}?reference_genome=${variant.reference_genome}`}
                            >
                              <VariantId
                                variantId={variant.variant_id}
                                referenceGenome={variant.reference_genome}
                              />
                            </Link>
                          </Item.Header>
                        </Item.Content>
                      </Item>
                    ))}
                  </Item.Group>
                </React.Fragment>
              ) : (
                <p>No variants.</p>
              )}
            </React.Fragment>
          );
        }}
      </Fetch>
    </Page>
  );
};

export default VariantsPage;
