import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import { TableProvider } from "@/contexts/table-context"

export default function Dashboard() {

        return (
                <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                                <div className="flex flex-col gap-4 mt-5 py-6 md:gap-6 md:py-6">
                                        <SectionCards />
                                        <div className="px-4 lg:px-6">
                                                <ChartAreaInteractive />
                                        </div>
                                        <TableProvider>
                                                <DataTable />
                                        </TableProvider>
                                </div>
                        </div>
                </div>
        )
}
