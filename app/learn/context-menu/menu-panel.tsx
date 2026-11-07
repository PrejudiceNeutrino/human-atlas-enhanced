// Adapted from Engineering Club context-menu/menu-panel.tsx (MIT).

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import { positionMenu } from "./context-target";
const menuNavigationKeys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"];

export type MenuCommand = {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
  hint?: string;
  current?: boolean;
  checked?: boolean;
  divider?: boolean;
  run?: () => void;
  children?: MenuCommand[];
};

type Props = {
  commands: MenuCommand[];
  footerCommands?: MenuCommand[];
  label: string;
  point: { x: number; y: number };
  anchor?: DOMRect;
  parent?: HTMLElement;
  onBack?: () => void;
  onClose: () => void;
  focusOnOpen?: boolean;
  hoverTimer: RefObject<ReturnType<typeof setTimeout> | undefined>;
  feedback?: { id: string; text: string } | null;
  menuId?: string;
};

export function MenuPanel({
  commands,
  footerCommands = [],
  label,
  point,
  anchor,
  parent,
  onBack,
  onClose,
  focusOnOpen = true,
  hoverTimer,
  feedback,
  menuId,
}: Props) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLElement>());
  const [child, setChild] = useState<{
    command: MenuCommand;
    anchor: DOMRect;
    parent: HTMLElement;
    keyboard: boolean;
  } | null>(null);
  const [position, setPosition] = useState(point);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(commands[0]?.id);
  // Resolve from live commands so shared state changes update open submenus.
  const childCommand = commands.find(({ id }) => id === child?.command.id);
  const cancelHover = () => clearTimeout(hoverTimer.current);
  const focusRow = (command: MenuCommand) => {
    setActive(command.id);
    buttons.current.get(command.id)?.focus({ preventScroll: true });
    buttons.current.get(command.id)?.scrollIntoView({ block: "nearest" });
  };
  const openChild = (command: MenuCommand, keyboard: boolean) => {
    cancelHover();
    const button = buttons.current.get(command.id);
    if (!command.children || !button) return;
    setChild({
      command,
      anchor: button.getBoundingClientRect(),
      parent: button,
      keyboard,
    });
  };
  const back = () => {
    cancelHover();
    onBack?.();
    parent?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    if (!panel.current) return;
    setPosition(
      positionMenu(
        point,
        panel.current.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        anchor,
      ),
    );
    setReady(true);
    // A panel is remounted for each activation; feedback never resets position or focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const navigationCommands = [...commands, ...footerCommands].filter(command => !command.disabled);
  const firstId = navigationCommands[0]?.id;
  useLayoutEffect(() => {
    if (!ready || !focusOnOpen) return;
    if (parent) buttons.current.get(firstId)?.focus({ preventScroll: true });
    else panel.current?.focus({ preventScroll: true });
  }, [ready, focusOnOpen, firstId, parent]);
  useEffect(() => () => clearTimeout(hoverTimer.current), [hoverTimer]);
  const renderCommand = (command: MenuCommand) => {
            const Item = command.href ? "a" : "button";
            return (
            <div role="presentation" key={command.id}>
              {command.divider && (
                <div role="separator" className="site-context-divider" />
              )}
              <Item
                href={command.href}
                ref={(node: HTMLAnchorElement | HTMLButtonElement | null) => {
                  if (node) buttons.current.set(command.id, node);
                  else buttons.current.delete(command.id);
                }}
                type={command.href ? undefined : "button"}
                role={
                  command.checked === undefined ? "menuitem" : "menuitemradio"
                }
                disabled={command.disabled}
                aria-label={command.label}
                title={command.icon ? command.label : undefined}
                aria-checked={command.checked}
                tabIndex={active === command.id ? 0 : -1}
                aria-haspopup={command.children ? "menu" : undefined}
                aria-controls={
                  command.children && child?.command.id === command.id
                    ? `${id}-${command.id}`
                    : undefined
                }
                aria-expanded={
                  command.children
                    ? child?.command.id === command.id
                    : undefined
                }
                aria-disabled={command.current || command.disabled || undefined}
                aria-current={command.current ? "page" : undefined}
                className="site-context-item"
                data-current={command.current || undefined}
                onKeyDown={(event) => {
                  if (command.href && event.key === " ") {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                onFocus={() => setActive(command.id)}
                onPointerEnter={(event) => {
                  if (
                    event.pointerType !== "mouse" &&
                    event.pointerType !== "pen"
                  )
                    return;
                  cancelHover();
                  // Keep the old branch while crossing diagonally toward its submenu.
                  hoverTimer.current = setTimeout(() => {
                    setActive(command.id);
                    if (command.children) openChild(command, false);
                    else setChild(null);
                  }, 180);
                }}
                onClick={(event) => {
                  if (command.href && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
                  if (command.href) event.preventDefault();
                  cancelHover();
                  if (command.current || command.disabled) return;
                  if (command.children) openChild(command, true);
                  else command.run?.();
                }}
              >
                {command.icon}
                <span>
                  {feedback?.id === command.id ? feedback.text : command.label}
                </span>
                {command.checked ? (
                  <small aria-hidden="true">✓</small>
                ) : command.current ? (
                  <small>Current</small>
                ) : command.children ? (
                  <span aria-hidden="true">›</span>
                ) : command.hint ? (
                  <small aria-hidden="true">{command.hint}</small>
                ) : null}
              </Item>
            </div>
          );};
  return (
    <>
      <div
        ref={panel}
        id={menuId ?? id}
        role="menu"
        tabIndex={-1}
        aria-label={label}
        className="site-context-panel"
        style={{
          left: position.x,
          top: position.y,
          visibility: ready ? "visible" : "hidden",
        }}
        onPointerEnter={cancelHover}
        onKeyDown={(event) => {
          if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.nativeEvent.isComposing
          )
            return;
          if (!menuNavigationKeys.includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          cancelHover();
          const index = navigationCommands.findIndex(
            (command) =>
              buttons.current.get(command.id) === document.activeElement,
          );
          const command = navigationCommands[index];
          if (event.key === "Escape") {
            onClose();
            return;
          }
          if (command && footerCommands.includes(command) && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
            const candidates = footerCommands.filter(item => !item.disabled);
            const destination = event.key === "ArrowLeft" ? candidates[0] : candidates.at(-1);
            if (destination) focusRow(destination);
            return;
          }
          if (event.key === "ArrowLeft") {
            if (onBack) back();
            return;
          }
          if (event.key === "ArrowRight") {
            if (command?.children) openChild(command, true);
            return;
          }
          setChild(null);
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? navigationCommands.length - 1
                : index < 0
                  ? event.key === "ArrowUp"
                    ? navigationCommands.length - 1
                    : 0
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      navigationCommands.length) %
                    navigationCommands.length;
          if (navigationCommands[next]) focusRow(navigationCommands[next]);
        }}
      >
        <div className="site-context-caption">
          {onBack ? (
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={back}
              aria-label={`Back from ${label}`}
            >
              <span aria-hidden="true">‹</span> {label}
            </button>
          ) : (
            <span>HUMAN ATLAS</span>
          )}
        </div>
        <div className="site-context-items" onScroll={() => setChild(null)}>
          {commands.map(renderCommand)}
        </div>
        {!onBack && footerCommands.length > 0 && <div className="site-context-quick-nav" role="group" aria-label="Reading page navigation">{footerCommands.map(renderCommand)}</div>}
        {!onBack && (
          <div className="site-context-hint">
            Shift + right-click for browser menu
          </div>
        )}
      </div>
      {child && childCommand?.children && (
        <MenuPanel
          key={child.command.id}
          menuId={`${id}-${child.command.id}`}
          commands={childCommand.children}
          label={childCommand.label}
          point={{ x: child.anchor.right, y: child.anchor.top - 5 }}
          anchor={child.anchor}
          parent={child.parent}
          onBack={() => setChild(null)}
          onClose={onClose}
          focusOnOpen={child.keyboard}
          hoverTimer={hoverTimer}
          feedback={feedback}
        />
      )}
    </>
  );
}
