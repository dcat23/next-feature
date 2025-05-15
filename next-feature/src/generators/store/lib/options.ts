import { names } from '@nx/devkit';

interface CreateMethodOptions {
  className: string;
  propertyName: string;
  persist?: boolean;
}

export function zustandCreateMethod(options: CreateMethodOptions): string {
  const { className, propertyName, persist } = options;
  return persist ? `
create<I${className}Store>()(
  persist(
    (set) => ({
      ${propertyName}: null,
      isLoading: false,
      set${className}: (${propertyName}) => set({ ${propertyName} }),
      toggleLoading: () => set(({ isLoading }) => ({ isLoading: !isLoading })),
    }),
    {
      name: '${propertyName}-storage',
    }
  )
);
` : `
create<I${className}Store>((set, get) => ({
  ${propertyName}: null,
  isLoading: false,
  set${className}: (${propertyName}: ${className}) => set({ ${propertyName} }),
  toggleLoading: () => set(({ isLoading }) => ({ isLoading: !isLoading })),
}));
`}

export function mutateNames(name: string): ReturnType<typeof names> {
  const n = names(name);
  const prefix = /^use/.test(n.fileName) ? "" : "use";
  const suffix = /store$/.test(n.fileName) ? "" : "store";
  const fileName = [prefix, n.fileName, suffix].join("-");

  return {
    ...n,
    fileName,
  }
}
