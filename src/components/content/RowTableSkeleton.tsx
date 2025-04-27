import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";

const RowTableSkeleton = () => {
  return Array.from({ length: 3 }).map((_, index) => (
    <TableRow>
      <TableCell>
        <Skeleton className="h-7 w-24 bg-gray-200" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-7 w-24 bg-gray-200" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-7 w-24 bg-gray-200" />
      </TableCell>
      <TableCell className="flex justify-end">
        <Skeleton className="h-7 w-24 bg-gray-200" />
      </TableCell>
    </TableRow>
  ));
};

export default RowTableSkeleton;
