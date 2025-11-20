"use client";

import { useMemo } from "react";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

export const statsModal = createModal({
  id: "stats-modal",
  isOpenedByDefault: false,
});

interface StatsData {
  bySource: Array<{ label: string; count: number }>;
  byType: Array<{ label: string; count: number }>;
  byEpci: Array<{ label: string; count: number }>;
}

interface StatsModalProps {
  stats: StatsData | null;
  isLoading: boolean;
}

interface BarChartProps {
  data: Array<{ label: string; count: number }>;
  title: string;
  width?: number;
  height?: number;
}

function BarChart({ data, title, width = 500, height = 300 }: BarChartProps) {
  const margin = { top: 20, right: 20, bottom: 100, left: 80 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, xMax],
        domain: data.map((d) => d.label || "N/A"),
        padding: 0.2,
      }),
    [data, xMax],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, Math.max(...data.map((d) => Number(d.count)))],
        nice: true,
      }),
    [data, yMax],
  );

  if (data.length === 0) {
    return (
      <div>
        <h4 className="fr-h6">{title}</h4>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="fr-h5 fr-mb-3w">{title}</h4>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {data.map((d) => {
            const label = d.label || "N/A";
            const barWidth = xScale.bandwidth();
            const barHeight = yMax - (yScale(Number(d.count)) ?? 0);
            const barX = xScale(label);
            const barY = yMax - barHeight;

            return (
              <Bar
                key={`bar-${label}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill="#000091"
                opacity={0.8}
                rx={6}
              />
            );
          })}
          <AxisLeft
            scale={yScale}
            stroke="#666"
            tickStroke="#666"
            tickLabelProps={() => ({
              fill: "#666",
              fontSize: 14,
              fontWeight: 500,
              textAnchor: "end",
              dy: "0.33em",
            })}
          />
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="#666"
            tickStroke="#666"
            tickLabelProps={() => ({
              fill: "#666",
              fontSize: 13,
              fontWeight: 500,
              textAnchor: "end",
              angle: -45,
              dx: "-0.25em",
              dy: "0.25em",
            })}
          />
        </Group>
      </svg>
    </div>
  );
}

export function StatsModal({ stats, isLoading }: StatsModalProps) {
  return (
    <>
      <style jsx global>{`
        #stats-modal-modal .fr-modal__body {
          max-width: 95vw !important;
        }
        #stats-modal-modal .fr-modal__content {
          max-width: 95vw !important;
        }
      `}</style>
      <statsModal.Component
        title="Statistiques des acteurs"
        size="large"
        buttons={[
          {
            children: "Fermer",
            onClick: () => statsModal.close(),
            size: "small",
          },
        ]}
      >
        {isLoading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div className="fr-loader" aria-label="Chargement en cours" />
            <p className="fr-mt-2w">Chargement des statistiques...</p>
          </div>
        )}

        {!isLoading && stats && (
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12">
              <BarChart
                data={stats.bySource}
                title="Répartition par source"
                width={1200}
                height={400}
              />
            </div>

            <div className="fr-col-12 fr-mt-4w">
              <BarChart
                data={stats.byType}
                title="Répartition par type d'acteur"
                width={1200}
                height={400}
              />
            </div>

            <div className="fr-col-12 fr-mt-4w">
              <BarChart
                data={stats.byEpci}
                title="Top 15 EPCI par nombre d'acteurs"
                width={1200}
                height={400}
              />
            </div>

            <div className="fr-col-12 fr-mt-4w">
              <h4 className="fr-h6">Résumé</h4>
              <ul>
                <li>
                  <strong>Sources de données :</strong> {stats.bySource.length}{" "}
                  sources différentes
                </li>
                <li>
                  <strong>Types d'acteurs :</strong> {stats.byType.length} types
                  différents
                </li>
                <li>
                  <strong>EPCI couverts :</strong> {stats.byEpci.length} EPCI
                  (top 15)
                </li>
              </ul>
            </div>
          </div>
        )}

        {!isLoading && !stats && <p>Impossible de charger les statistiques.</p>}
      </statsModal.Component>
    </>
  );
}
