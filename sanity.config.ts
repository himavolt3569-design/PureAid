import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./src/sanity/schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "00000000";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const singletonTypes = new Set(["siteSettings", "homePage", "campaignsPage"]);

export default defineConfig({
  name: "pureaid",
  title: "PureAID Content",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("PureAID content")
          .items([
            S.listItem()
              .title("Site settings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.listItem()
              .title("Home page")
              .child(S.document().schemaType("homePage").documentId("homePage")),
            S.listItem()
              .title("Campaigns page")
              .child(S.document().schemaType("campaignsPage").documentId("campaignsPage")),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => !singletonTypes.has(item.getId() ?? "")),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
