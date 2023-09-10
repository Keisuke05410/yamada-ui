import { isArray, isObject, merge, runIfFunc, Dict } from '@yamada-ui/utils'
import {
  styles,
  pseudos,
  ConfigProps,
  keyframes as emotionKeyframes,
} from '../styles'
import { StyledTheme } from '../theme.types'
import { BreakpointQueries } from './breakpoint'
import { CSSObjectOrFunc, CSSUIObject, CSSUIProps } from './css.types'

const expandAnimation = ({
  keyframes,
  duration = '0s',
  timingFunction = 'ease',
  delay = '0s',
  iterationCount = '1',
  direction = 'normal',
  fillMode = 'none',
  playState = 'running',
}: Dict) => {
  const name = emotionKeyframes(keyframes)

  return `${name} ${duration} ${timingFunction} ${delay} ${iterationCount} ${direction} ${fillMode} ${playState}`
}

const expandColorMode = (key: string, value: any[]): Dict => ({
  [key]: value[0],
  [pseudos._dark]: {
    [key]: value[1],
  },
})

const expandResponsive = (
  key: string,
  value: Dict,
  queries: BreakpointQueries,
): Dict =>
  Object.entries(value).reduce((css, [breakpointKey, breakpointValue]) => {
    if (breakpointKey === 'base') {
      css[key] = breakpointValue
    } else {
      const query = queries.find(
        ({ breakpoint }) => breakpoint === breakpointKey,
      )?.maxWQuery

      if (query) css[query] = { [key]: breakpointValue }
    }

    return css
  }, {} as Dict)

const expandCSS =
  (css: CSSUIProps | CSSUIObject) =>
  (theme: StyledTheme<Dict>): Dict => {
    if (!theme.__breakpoints) return css

    const { isResponsive, queries } = theme.__breakpoints

    let computedCSS: Dict = {}

    for (let [key, value] of Object.entries(css)) {
      value = runIfFunc(value, theme)

      if (value == null) continue

      if (isArray(value)) {
        computedCSS = merge(computedCSS, expandColorMode(key, value))

        continue
      }

      if (isObject(value) && isResponsive(value)) {
        computedCSS = merge(computedCSS, expandResponsive(key, value, queries))

        continue
      }

      computedCSS[key] = value
    }

    return computedCSS
  }

export const getCSS = (options: {
  theme: StyledTheme<Dict>
  styles: Dict
  pseudos: Dict
}): ((cssOrFunc: CSSObjectOrFunc | CSSUIObject) => Dict) => {
  const { theme, styles = {}, pseudos = {} } = options

  const createCSS = (
    cssOrFunc: CSSObjectOrFunc | CSSUIObject,
    isNested: boolean = false,
  ): Dict => {
    const css = runIfFunc(cssOrFunc, theme)
    const computedCSS = expandCSS(css)(theme)

    let resolvedCSS: Dict = {}

    for (let [key, value] of Object.entries(computedCSS)) {
      value = runIfFunc(value, theme)

      if (value == null) continue

      if (key in pseudos) key = pseudos[key]

      let style: ConfigProps | undefined | true = styles[key]

      if (style === true) style = { properties: key }

      if (isObject(value)) {
        resolvedCSS[key] = resolvedCSS[key] ?? {}
        resolvedCSS[key] = merge(resolvedCSS[key], createCSS(value, true))

        continue
      }

      value = style?.transform?.(value, theme) ?? value

      if (style?.isAnimation && isObject(value)) {
        value = expandAnimation(createCSS(value, true))
      }

      if (style?.isProcessResult) {
        value = createCSS(value, true)
      }

      if (!isNested && style?.static) {
        const staticStyles = runIfFunc(style.static, theme)

        resolvedCSS = merge(resolvedCSS, staticStyles)
      }

      const properties = runIfFunc(style?.properties, theme)

      if (properties) {
        if (isArray(properties)) {
          for (const property of properties) {
            resolvedCSS[property] = value
          }

          continue
        } else if (isObject(value)) {
          resolvedCSS = merge(resolvedCSS, value)

          continue
        } else {
          resolvedCSS[properties] = value

          continue
        }
      }

      if (isObject(value)) {
        resolvedCSS = merge(resolvedCSS, value)

        continue
      }

      resolvedCSS[key] = value
    }

    return resolvedCSS
  }

  return createCSS
}

export const css =
  (cssObject: CSSObjectOrFunc | CSSUIObject) =>
  (theme: StyledTheme<Dict>): Dict =>
    getCSS({
      theme,
      styles,
      pseudos,
    })(cssObject)
