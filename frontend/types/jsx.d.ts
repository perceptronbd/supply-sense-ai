/// <reference types="react" />

// Fix for React 19 JSX namespace issue with react-markdown
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Re-export React JSX types for compatibility
import * as React from 'react';
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes extends React.Attributes { }
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
