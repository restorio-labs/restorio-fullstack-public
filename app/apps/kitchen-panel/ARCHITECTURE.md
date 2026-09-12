# Kitchen Panel Architecture

## 📁 Directory Structure

```
src/
├── features/                    # Feature-based organization
│   ├── orders/                 # Order management feature
│   │   ├── components/         # Order-specific components
│   │   │   ├── DragOverlay.tsx
│   │   │   ├── DropZoneBar.tsx
│   │   │   └── index.ts
│   │   ├── hooks/              # Order-specific hooks
│   │   │   ├── useDragAndDrop.ts
│   │   │   ├── useOrdersState.ts
│   │   │   ├── useOrdersDragAndDrop.ts
│   │   │   ├── useViewMode.ts
│   │   │   ├── useColumnNavigation.ts
│   │   │   └── index.ts
│   │   ├── types/              # Order-specific types
│   │   │   ├── orders.types.ts
│   │   │   └── index.ts
│   │   └── index.ts            # Feature barrel export
│   │
│   └── restaurants/            # Restaurant management feature
│       ├── hooks/
│       │   ├── useTenantRestaurants.ts
│       │   ├── useRestaurantSelection.ts
│       │   └── index.ts
│       ├── types/
│       │   ├── restaurant.types.ts
│       │   └── index.ts
│       └── index.ts
│
├── views/                      # Thin view layer (composition only)
│   ├── KitchenView/
│   │   ├── KitchenView.tsx    # ~240 lines, mostly composition
│   │   └── index.ts
│   └── LoginView.tsx
│
├── layouts/                    # App-wide layouts
│   ├── AppLayout.tsx
│   └── PageLayout.tsx
│
├── mocks/                      # Mock data for development
│   └── orders.ts
│
├── wrappers/                   # Context providers
│   └── AppProviders.tsx
│
├── App.tsx                     # Main app component
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

## 🎯 Key Principles

### 1. Feature-Based Organization

- Each feature is self-contained with its own components, hooks, types, and utilities
- Easy to locate related code
- Can be extracted to a separate package if needed
- Clear boundaries between features

### 2. Thin Views

- Views orchestrate features
- Minimal business logic
- Focus on layout and composition
- Easy to understand the page structure

### 3. Barrel Exports

- Each feature exports through `index.ts`
- Clean imports in consuming code
- Easy to refactor internals without breaking consumers

### 4. Separation of Concerns

- **Components**: UI rendering only
- **Hooks**: Business logic and state management
- **Types**: Type definitions
- **Utils**: Helper functions (when needed)

## 📦 How to Use Features

### Importing from Features

```typescript
// ✅ Good: Import from feature
import { useOrdersState, useOrdersDragAndDrop, DragOverlay } from "@/features/orders";
import { useTenantRestaurants, useRestaurantSelection } from "@/features/restaurants";

// ❌ Bad: Deep imports
import { useOrdersState } from "@/features/orders/hooks/useOrdersState";
```

### Example: Using the Orders Feature

```typescript
import { useOrdersState, useOrdersDragAndDrop } from "@/features/orders";

const MyComponent = () => {
  const { orders, moveOrder } = useOrdersState(initialOrders);
  const { dragState, getDragHandleProps } = useOrdersDragAndDrop(orders, moveOrder);

  // Your component logic
};
```

## 🔄 When to Add a New Feature

Create a new feature when:

- You have 3+ related components
- You have domain-specific business logic
- The feature could potentially be reused or extracted
- You want to clearly separate concerns

### Feature Template

```
features/my-feature/
├── components/
│   ├── MyComponent/
│   │   ├── MyComponent.tsx
│   │   ├── MyComponent.types.ts (optional)
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useMyFeature.ts
│   └── index.ts
├── types/
│   ├── my-feature.types.ts
│   └── index.ts
├── utils/              (optional)
│   ├── helpers.ts
│   └── index.ts
└── index.ts
```

## 📊 Feature: Orders

### Responsibilities

- Order state management
- Drag and drop interactions
- View mode (sliding/all) management
- Column navigation
- Visual feedback during drag operations

### Key Hooks

- `useOrdersState`: Manages order list and movement
- `useOrdersDragAndDrop`: Handles drag & drop with pointer events
- `useViewMode`: Manages view mode toggle and persistence
- `useColumnNavigation`: Handles URL-based column navigation
- `useDragAndDrop`: Low-level pointer event handling

### Components

- `DragOverlay`: Floating drag preview
- `DropZoneBar`: Bottom drop zone targets

## 📊 Feature: Restaurants

### Responsibilities

- Tenant restaurant management
- Restaurant selection and persistence

### Key Hooks

- `useTenantRestaurants`: Fetches tenant restaurants
- `useRestaurantSelection`: Manages selected restaurant with localStorage

## 🚀 Benefits of This Architecture

1. **Scalability**: Add new features without affecting existing ones
2. **Maintainability**: Clear organization, easy to find code
3. **Testability**: Test features in isolation
4. **Team Collaboration**: Multiple developers can work on different features
5. **Code Reuse**: Easy to identify truly shared code vs feature-specific code
6. **Refactoring**: Easier to extract features to separate packages
7. **Onboarding**: New developers can understand one feature at a time

## 📝 Best Practices

### Keep Views Thin

```typescript
// ✅ Good: View orchestrates features
const MyView = () => {
  const { data, actions } = useMyFeature();
  return <MyFeatureComponent data={data} {...actions} />;
};

// ❌ Bad: View contains business logic
const MyView = () => {
  const [state, setState] = useState();
  const handleComplexLogic = () => { /* 50 lines */ };
  // ... more logic
};
```

### Extract Complex Logic to Hooks

- If a component has > 50 lines of logic, extract to a custom hook
- Keep components focused on rendering
- Make hooks testable and reusable

### Use TypeScript Strictly

- Define types in feature's `types/` directory
- Export types through barrel exports
- Avoid `any` and `unknown` types

### Document Complex Features

- Add JSDoc comments to complex hooks
- Document non-obvious business logic
- Keep architecture docs updated

## 🎓 Migration Guide

If you need to add to or refactor this structure:

1. **Adding a new feature**:
   - Create directory in `features/`
   - Add components, hooks, types as needed
   - Create barrel export
   - Update this doc

2. **Moving code between features**:
   - Identify the feature it belongs to
   - Move files to appropriate directories
   - Update imports
   - Update barrel exports

3. **Extracting to shared UI**:
   - Only move truly reusable components
   - Remove feature-specific logic
   - Create proper abstraction layer
