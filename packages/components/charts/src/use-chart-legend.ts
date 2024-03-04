import type { CSSUIObject } from "@yamada-ui/core"
import { getCSS, useTheme } from "@yamada-ui/core"
import { cx, splitObject } from "@yamada-ui/utils"
import { useCallback } from "react"
import type { LegendProps } from "recharts"
import type { ChartPropGetter, LegendUIProps } from "./chart.types"
import { legendProperties } from "./chart.types"

export type UseChartLegendProps = {
  /**
   *  Props passed down to recharts 'Legend' component.
   */
  legendProps?: LegendUIProps
}

export const useChartLegend = ({ legendProps = {} }: UseChartLegendProps) => {
  const { theme } = useTheme()
  const [reChartProps, uiProps] = splitObject(legendProps, legendProperties)
  const propClassName = getCSS(uiProps as CSSUIObject)(theme)

  const getLegendProps: ChartPropGetter<
    "div",
    Partial<LegendProps>,
    Omit<LegendProps, "ref">
  > = useCallback(
    ({ className, ...props } = {}, ref = null) => {
      return {
        ref,
        className: cx(className, propClassName),
        verticalAlign: "top",
        ...props,
        ...reChartProps,
      }
    },
    [propClassName, reChartProps],
  )

  return { getLegendProps }
}
