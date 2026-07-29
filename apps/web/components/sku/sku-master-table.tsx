import type { SkuMaster } from '@three-way-match/shared';
import { Table } from '@/components/ui/table';
export function SkuMasterTable({ rows }: { rows: SkuMaster[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th className="p-3">ERP Code</th>
          <th>Name</th>
          <th>EAN</th>
          <th>UOM</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr className="border-t" key={row.id}>
            <td className="p-3 font-mono">{row.skuErpCode}</td>
            <td>{row.name}</td>
            <td>{row.eanCode}</td>
            <td>{row.uom}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
