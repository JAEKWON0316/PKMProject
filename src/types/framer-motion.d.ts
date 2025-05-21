import * as React from 'react';

// framer-motion 관련 타입 정의
declare module 'framer-motion' {
  export interface AnimationProps {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }

  export type MotionProps = AnimationProps & React.HTMLAttributes<HTMLElement>;

  export interface Motion {
    div: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLDivElement>>;
    p: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLParagraphElement>>;
    span: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLSpanElement>>;
    h1: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h2: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h3: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h4: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h5: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h6: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    a: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLAnchorElement>>;
    button: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLButtonElement>>;
    ul: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLUListElement>>;
    li: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLLIElement>>;
    // 필요에 따라 다른 HTML 요소를 여기에 추가할 수 있습니다.
  }

  export const motion: Motion;
  
  // AnimatePresence 컴포넌트
  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
  }
  
  export const AnimatePresence: React.FC<AnimatePresenceProps>;
  
  // 애니메이션 컨트롤 관련 함수들
  export function useAnimation(): any;
  export function useCycle<T>(...items: T[]): [T, (next?: number) => void];
  export function useTransform<T>(
    value: any,
    inputRange: number[],
    outputRange: T[],
    options?: any
  ): any;
  export function useViewportScroll(): {
    scrollX: any;
    scrollY: any;
    scrollXProgress: any;
    scrollYProgress: any;
  };
}

// JSX 요소를 위한 타입 정의
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}