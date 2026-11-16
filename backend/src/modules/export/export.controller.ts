import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { Expo } from '../../models/Expo';

export class ExportController {
  /**
   * Export expos to Microsoft Excel (.xlsx) using ExcelJS
   */
  static async exportExcel(req: Request, res: Response): Promise<void> {
    try {
      const { search, industry, country, city, status, dateFrom, dateTo } = req.query;
      const query: any = {};

      if (search && typeof search === 'string') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { organizer: regex },
          { venue: regex },
          { city: regex },
          { country: regex },
        ];
      }
      if (industry && industry !== 'ALL') query.industry = industry;
      if (country && country !== 'ALL') query.country = country;
      if (city && city !== 'ALL') query.city = city;
      if (status && status !== 'ALL') query.status = status;
      if (dateFrom || dateTo) {
        query.startDate = {};
        if (dateFrom) query.startDate.$gte = new Date(dateFrom as string);
        if (dateTo) query.startDate.$lte = new Date(dateTo as string);
      }

      const expos = await Expo.find(query).sort({ startDate: 1 }).lean();

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Business Expo Fetching Software';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Business Expos', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
      });

      sheet.columns = [
        { header: 'Expo Name', key: 'name', width: 35 },
        { header: 'Organizer', key: 'organizer', width: 25 },
        { header: 'Industry', key: 'industry', width: 22 },
        { header: 'Start Date', key: 'startDate', width: 14 },
        { header: 'End Date', key: 'endDate', width: 14 },
        { header: 'Venue', key: 'venue', width: 30 },
        { header: 'City', key: 'city', width: 18 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Country', key: 'country', width: 18 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Registration URL', key: 'registrationUrl', width: 35 },
        { header: 'Source URL', key: 'sourceUrl', width: 35 },
        { header: 'Description', key: 'description', width: 45 },
      ];

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.height = 28;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0270C7' }, // Professional blue
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Add data rows
      expos.forEach((item, index) => {
        const row = sheet.addRow({
          name: item.name,
          organizer: item.organizer || 'Not Specified',
          industry: item.industry || 'General',
          startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
          endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
          venue: item.venue || '',
          city: item.city || '',
          state: item.state || '',
          country: item.country || '',
          status: item.status || 'UPCOMING',
          registrationUrl: item.registrationUrl || '',
          sourceUrl: item.sourceUrl || '',
          description: item.description || '',
        });

        // Alternating row background for clean readability
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
        row.alignment = { vertical: 'middle', wrapText: false };
      });

      // Auto-filter
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheet.columns.length },
      };

      const filename = `business-expos-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Export expos to CSV format
   */
  static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const { search, industry, country, status } = req.query;
      const query: any = {};
      if (search && typeof search === 'string') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { city: regex }, { country: regex }];
      }
      if (industry && industry !== 'ALL') query.industry = industry;
      if (country && country !== 'ALL') query.country = country;
      if (status && status !== 'ALL') query.status = status;

      const expos = await Expo.find(query).sort({ startDate: 1 }).lean();

      const headers = [
        'Name',
        'Organizer',
        'Industry',
        'Start Date',
        'End Date',
        'Venue',
        'City',
        'State',
        'Country',
        'Status',
        'Registration URL',
        'Source URL',
      ];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = expos.map((e) => [
        escapeCsv(e.name),
        escapeCsv(e.organizer),
        escapeCsv(e.industry),
        escapeCsv(e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : ''),
        escapeCsv(e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : ''),
        escapeCsv(e.venue),
        escapeCsv(e.city),
        escapeCsv(e.state),
        escapeCsv(e.country),
        escapeCsv(e.status),
        escapeCsv(e.registrationUrl),
        escapeCsv(e.sourceUrl),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const filename = `business-expos-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
