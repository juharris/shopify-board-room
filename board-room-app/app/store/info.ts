import shopify from '../shopify.server'

export interface Product {
  title: string;
  description?: string;
}

export async function getStoreInfo(request: Request) {
  const { admin } = await shopify.authenticate.admin(request)

  const response = await admin.graphql(`
    {
      shop {
        name
      }
      products(first: 25) {
        nodes {
          title
          description
        }
      }
    }`)

  const { data } = await response.json()

  for (const product of data.products.nodes) {
    // Ignore many descriptions which are empty strings.
    if (!product.description) {
      delete product.description
    }
  }
  return data
}
