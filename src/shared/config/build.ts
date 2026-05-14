export type AppBuildMeta = {
  version: string;
  releaseSha: string;
  releaseCreatedAt: string;
  environment: string;
};

export function getEmbeddedBuildMeta(): AppBuildMeta {
  return {
    version: __APP_VERSION__,
    releaseSha: __APP_RELEASE_SHA__,
    releaseCreatedAt: __APP_RELEASE_CREATED_AT__,
    environment: import.meta.env.MODE
  };
}

export async function getAvailableBuildMeta(): Promise<AppBuildMeta | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}app-build.json?ts=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AppBuildMeta;
  } catch {
    return null;
  }
}
