module.exports = {
  forbidden: [
    {
      name: "no-circular-dependencies",
      comment: "src 内の循環依存を禁止する。",
      severity: "error",
      from: {
        path: "^src"
      },
      to: {
        circular: true
      }
    },
    {
      name: "no-components-to-api",
      comment: "小さいUIコンポーネントはAPI clientを直接呼ばない。TodoPage/useTodos経由にする。",
      severity: "error",
      from: {
        path: "^src/features/[^/]+/components/"
      },
      to: {
        path: "^src/features/[^/]+/api/"
      }
    },
    {
      name: "no-components-to-hooks",
      comment: "小さいUIコンポーネントはhookを直接呼ばない。状態管理は親画面へ寄せる。",
      severity: "error",
      from: {
        path: "^src/features/[^/]+/components/"
      },
      to: {
        path: "^src/features/[^/]+/hooks/"
      }
    },
    {
      name: "no-routes-to-api",
      comment: "画面routeはAPI clientを直接呼ばない。useTodosなどのhookを通す。",
      severity: "error",
      from: {
        path: "^src/features/[^/]+/routes/"
      },
      to: {
        path: "^src/features/[^/]+/api/"
      }
    },
    {
      name: "no-api-to-ui",
      comment: "API clientはUI、hook、routeへ依存しない。",
      severity: "error",
      from: {
        path: "^src/features/[^/]+/api/"
      },
      to: {
        path: "^src/features/[^/]+/(components|hooks|routes)/"
      }
    },
    {
      name: "no-utils-to-runtime-feature-parts",
      comment: "utilsはUI、hook、API、routeへ依存しない。純粋処理に寄せる。",
      severity: "error",
      from: {
        path: "^src/features/[^/]+/utils/"
      },
      to: {
        path: "^src/features/[^/]+/(components|hooks|api|routes)/"
      }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    exclude: {
      path: "node_modules|dist|harness_runs|\\.runtime"
    }
  }
};
