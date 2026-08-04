import {
  forwardRef,
  useCallback,
  useRef,
} from "react";
import { Polymorph } from "./core/Slot.jsx";
import { useComposedRefs } from "./core/refs.js";
import {
  captureElementGeometry,
  registerMorphAnimation,
  unregisterMorphAnimation,
} from "./internal/SheetMotion.js";
import {
  useSheet,
  useStacking,
  useTravel,
} from "./internal/SheetState.jsx";

const resolveTravelValue = (value, context) => {
  if (value === "ignore" || value == null || value === false) return "";
  if (typeof value === "function") return value(context) ?? "";
  if (Array.isArray(value)) return context.tween(value[0], value[1]);
  return value;
};

const Content = forwardRef(function SheetMorphContent(
  {
    className,
    style,
    asChild,
    travelAnimation,
    stackingAnimation,
    from = "trigger",
    children,
    tabIndex = -1,
    ...rest
  },
  forwardedRef
) {
  const { motionOriginRef } = useSheet();
  const ref = useRef(null);
  const geometryRef = useRef(null);
  const animationRef = useRef(null);
  const attachRef = useCallback((node) => {
    const previous = ref.current;
    if (previous && previous !== node) unregisterMorphAnimation(previous);
    ref.current = node;
    geometryRef.current = null;
    if (node && from) {
      registerMorphAnimation(node, () => animationRef.current);
    }
  }, [from]);
  const composed = useComposedRefs(forwardedRef, attachRef);
  const userProperties = travelAnimation?.properties || travelAnimation || {};
  const userTransform = userProperties.transform;

  const measureGeometry = ({ axis, parentOffset } = {}) => {
    if (geometryRef.current) return geometryRef.current;
    if ((axis !== "x" && axis !== "y") || !Number.isFinite(parentOffset)) {
      return null;
    }
    if (!from || !ref.current) return null;
    const target = captureElementGeometry(ref.current);
    const source =
      from === "trigger"
        ? motionOriginRef.current
        : captureElementGeometry(from?.current || from);
    if (
      !source ||
      !target ||
      !(target.rect.width > 0) ||
      !(target.rect.height > 0)
    ) {
      return null;
    }
    geometryRef.current = {
      x: source.rect.left - target.rect.left,
      y: source.rect.top - target.rect.top,
      scaleX: source.rect.width / target.rect.width,
      scaleY: source.rect.height / target.rect.height,
      originRadius: source.borderRadius,
      targetRadius: target.borderRadius,
    };
    return geometryRef.current;
  };

  const animation = from
    ? {
        properties: {
          ...userProperties,
          transformOrigin: userProperties.transformOrigin || "top left",
          borderRadius:
            userProperties.borderRadius ||
            ((context) => {
              const geometry = measureGeometry(context);
              if (!geometry) return "";
              return `${
                geometry.originRadius +
                (geometry.targetRadius - geometry.originRadius) *
                  context.progress
              }px`;
            }),
          transform: (context) => {
            const geometry = measureGeometry(context);
            const extra = resolveTravelValue(userTransform, context);
            if (!geometry) return extra;
            const inverse = 1 - context.progress;
            const morph =
              `translate(${geometry.x * inverse}px, ${geometry.y * inverse}px) ` +
              `scale(${1 + (geometry.scaleX - 1) * inverse}, ${
                1 + (geometry.scaleY - 1) * inverse
              })`;
            return extra ? `${morph} ${extra}` : morph;
          },
        },
      }
    : travelAnimation;

  animationRef.current = animation;
  useTravel(ref, animation, null, from ? { register: false } : undefined);
  useStacking(ref, stackingAnimation);

  return (
    <Polymorph
      asChild={asChild}
      ref={composed}
      data-velvet="content"
      data-velvet-morph={
        from === "trigger" ? "trigger" : from ? "element" : undefined
      }
      className={className}
      style={style}
      tabIndex={tabIndex}
      {...rest}
    >
      {children}
    </Polymorph>
  );
});

export const SheetMorph = { Content };
