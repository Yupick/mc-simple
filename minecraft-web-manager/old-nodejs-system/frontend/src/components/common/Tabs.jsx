import * as TabsPrimitive from '@radix-ui/react-tabs';

/**
 * Componente Tabs reutilizable con estilo Azure Clean
 *
 * Ejemplo de uso:
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Contenido 1</TabsContent>
 *   <TabsContent value="tab2">Contenido 2</TabsContent>
 * </Tabs>
 */

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ children, className = '', ...props }) => (
  <TabsPrimitive.List
    className={`flex border-b border-slate-200 ${className}`}
    {...props}
  >
    {children}
  </TabsPrimitive.List>
);

export const TabsTrigger = ({ children, value, className = '', ...props }) => (
  <TabsPrimitive.Trigger
    value={value}
    className={`
      px-4 py-3 text-sm font-medium text-slate-600
      border-b-2 border-transparent
      hover:text-slate-900 hover:border-slate-300
      data-[state=active]:text-primary-600
      data-[state=active]:border-primary-500
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      ${className}
    `}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
);

export const TabsContent = ({ children, value, className = '' }) => (
  <TabsPrimitive.Content
    value={value}
    className={`pt-6 focus:outline-none animate-fade-in ${className}`}
  >
    {children}
  </TabsPrimitive.Content>
);
