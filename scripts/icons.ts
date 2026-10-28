import { basename } from 'node:path';
import manifest from 'material-icon-theme/dist/material-icons.json' with { type: 'json' };

type Associations = {
  file?: string;
  fileNames?: Record<string, string>;
  fileExtensions?: Record<string, string>;
};
const theme = manifest as Associations & {
  light?: Associations;
  iconDefinitions: Record<string, { iconPath: string }>;
};

function association(name: string, variant?: Associations) {
  const filename = name.toLowerCase();
  const own = (mapping: Record<string, string> | undefined, key: string) =>
    mapping && Object.hasOwn(mapping, key) ? mapping[key] : undefined;
  const byName =
    own(variant?.fileNames, filename) || own(theme.fileNames, filename);
  if (byName) return byName;
  for (
    let dot = filename.indexOf('.');
    dot !== -1;
    dot = filename.indexOf('.', dot + 1)
  ) {
    const extension = filename.slice(dot + 1);
    const icon =
      own(variant?.fileExtensions, extension) ||
      own(theme.fileExtensions, extension);
    if (icon) return icon;
  }
  return variant?.file || theme.file || 'file';
}

export function resolveFileIcons(name: string): {
  icon: string;
  iconLight?: string;
} {
  const icon = basename(
    theme.iconDefinitions[association(name)].iconPath,
    '.svg',
  );
  const light = basename(
    theme.iconDefinitions[association(name, theme.light)].iconPath,
    '.svg',
  );
  return { icon, ...(light !== icon ? { iconLight: light } : {}) };
}
