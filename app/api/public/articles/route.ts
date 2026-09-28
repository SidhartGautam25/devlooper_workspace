import {
  PublicArticleController,
  publicArticlesOptions,
} from "@/lib/controllers/PublicArticleController";

export function OPTIONS(request: Request) {
  return publicArticlesOptions(request);
}

export function GET(request: Request) {
  return PublicArticleController.list(request);
}
