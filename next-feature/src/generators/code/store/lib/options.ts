import { names } from '@nx/devkit';
import { singularize } from '../../../../lib/utils/string';

interface CreateMethodOptions {
  className: string;
  propertyName: string;
  persist?: boolean;
  useContext?: boolean
}

export function zustandCreateMethod(options: CreateMethodOptions): string {
  const { className, propertyName, persist } = options;
  return persist ? `
create<${className}Store>()(
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
create<${className}Store>((set, get) => ({
  ${propertyName}: null,
  isLoading: false,
  set${className}: (${propertyName}: ${className}) => set({ ${propertyName} }),
  toggleLoading: () => set(({ isLoading }) => ({ isLoading: !isLoading })),
}));
`}

type MutateNamesOptions = {
  name: string;
  useContext?: boolean;
}
export function mutateNames({ name, useContext }: MutateNamesOptions): ReturnType<typeof names> {
  const n = names(name);

  const testStr = useContext ? "context" : "store";
  const regex = new RegExp(`${testStr}$`)
  const suffix = regex.test(n.fileName) ? "" : testStr;

  const fileName = [n.fileName, suffix].join("-");

  return {
    ...n,
    fileName,
  }
}
