import csv
import math

def split_csv_in_parts(input_file, output_prefix, num_parts=5):
    with open(input_file, 'r', newline='', encoding='utf-8') as infile:
        reader = list(csv.reader(infile))
        header = reader[0]
        rows = reader[1:]

        total_rows = len(rows)
        part_size = math.ceil(total_rows / num_parts)

        for i in range(num_parts):
            start_index = i * part_size
            end_index = start_index + part_size
            part_rows = rows[start_index:end_index]

            output_file = f"{output_prefix}{i + 1}.csv"
            with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
                writer = csv.writer(outfile)
                writer.writerow(header)
                writer.writerows(part_rows)

            print(f"Created: {output_file} with {len(part_rows)} rows")

# Example usage:
split_csv_in_parts('acteurs.csv', 'acteurs_part_', num_parts=5)
