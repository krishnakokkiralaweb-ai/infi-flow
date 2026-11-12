import { useEffect } from "react";

const SITE_NAME = "INFI FLOW";

// Sets the browser tab title for the current page.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Learn Blender 3D in Telugu`;
  }, [title]);
}
