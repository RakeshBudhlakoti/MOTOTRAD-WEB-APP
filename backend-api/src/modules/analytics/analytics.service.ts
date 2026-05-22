import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = { gte: startDate, lte: endDate };
    }

    const [
      userCount, 
      activeAuctions, 
      gmvData, 
      categoryPerformance,
      sellerPerformance
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.aggregate({
        where: { ...whereClause, status: 'FULLY_PAID' as any },
        _sum: { totalAmount: true },
      }),
      this.prisma.category.findMany({
        include: {
          products: {
            include: {
              auctions: {
                where: { status: 'ENDED_SOLD' },
                include: { order: true }
              }
            }
          }
        }
      }),
      this.prisma.sellerProfile.findMany({
        take: 5,
        include: {
          user: true,
          _count: {
            select: { products: true }
          }
        },
        orderBy: { products: { _count: 'desc' } }
      })
    ]);

    // Calculate Success Rate
    const totalEnded = await this.prisma.auction.count({
      where: { status: { in: ['ENDED_SOLD', 'ENDED_UNSOLD'] } }
    });
    const totalSold = await this.prisma.auction.count({
      where: { status: 'ENDED_SOLD' }
    });

    return {
      overview: {
        users: userCount,
        activeAuctions: activeAuctions,
        gmv: gmvData._sum.totalAmount || 0,
        revenue: Number(gmvData._sum.totalAmount || 0) * 0.1, // 10% Platform fee example
        successRate: totalEnded > 0 ? (totalSold / totalEnded) * 100 : 0,
      },
      categories: categoryPerformance.map(cat => ({
        name: cat.name,
        count: cat.products.length,
        sales: cat.products.reduce((acc, prod) => 
          acc + prod.auctions.reduce((a, auc) => a + Number(auc.order?.totalAmount || 0), 0), 0
        )
      })),
      topSellers: sellerPerformance.map(seller => ({
        name: (seller as any).companyName || (seller as any).businessName,
        productCount: seller._count.products,
        user: seller.user.email
      }))
    };
  }

  async getAuditLogs(query: any) {
    return this.prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async exportOrdersCsv() {
    const orders = await this.prisma.order.findMany({
      include: { buyer: true, auction: { include: { product: true } } }
    });

    const { Parser } = require('json2csv');
    const fields = ['id', 'buyer.email', 'auction.product.title', 'totalAmount', 'status', 'createdAt'];
    const parser = new Parser({ fields });
    return parser.parse(orders);
  }

  async getDashboardOverview() {
    const [
      totalUsers,
      activeAuctionsCount,
      pendingAuctionsCount,
      soldProductsCount,
      totalOrdersCount,
      totalBidsCount,
      featuredProductsCount,
      totalCategoriesCount,
      totalBasketsCount,
      totalSellersCount,
      recentUsers,
      paymentOverviewPaid,
      paymentOverviewPartial,
      paymentOverviewPending,
      categoriesOverview,
      basketsOverview,
      latestOrders,
      liveAuctions
    ] = await Promise.all([
      // 1. Total Users
      this.prisma.user.count(),
      // 2. Active Auctions
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      // 3. Pending Auctions
      this.prisma.auction.count({ where: { status: 'PENDING' } }),
      // 4. Sold Products
      this.prisma.product.count({ where: { OR: [{ status: 'SOLD' }, { isSoldOut: true }] } }),
      // 5. Total Orders
      this.prisma.order.count(),
      // 6. Total Bids
      this.prisma.bid.count(),
      // 7. Featured Products
      this.prisma.product.count({ where: { isFeatured: true } }),
      // 8. Total Categories
      this.prisma.category.count(),
      // 9. Total Baskets (Buckets)
      this.prisma.basket.count(),
      // 10. Total Sellers
      this.prisma.sellerProfile.count(),
      // Recent Registrations
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { role: true }
      }),
      // Payment Overview Paid
      this.prisma.order.count({ where: { status: 'FULLY_PAID' } }),
      // Payment Overview Partial
      this.prisma.order.count({ where: { status: 'PARTIALLY_PAID' } }),
      // Payment Overview Pending
      this.prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      // Top Categories
      this.prisma.category.findMany({
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: {
          products: { _count: 'desc' }
        },
        take: 5
      }),
      // Top Baskets
      this.prisma.basket.findMany({
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: {
          products: { _count: 'desc' }
        },
        take: 5
      }),
      // Latest Orders
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: true,
          auction: {
            include: {
              product: {
                include: {
                  media: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              }
            }
          },
          payments: {
            where: { status: 'COMPLETED' }
          }
        }
      }),
      // Live Auctions
      this.prisma.auction.findMany({
        where: { status: 'ACTIVE' },
        take: 10,
        orderBy: { endTime: 'asc' },
        include: {
          product: {
            include: {
              category: true,
              basket: true,
              media: {
                where: { isPrimary: true },
                take: 1
              },
              seller: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })
    ]);

    // 12 Months Ago Date Setup
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [allPaymentsForRevenue, allAuctionsForMonthly] = await Promise.all([
      // Fetch completed payments for revenue line graph
      this.prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: twelveMonthsAgo }
        },
        select: {
          amount: true,
          createdAt: true
        }
      }),
      // Fetch auctions for dynamic auction overview monthly graph
      this.prisma.auction.findMany({
        where: {
          createdAt: { gte: twelveMonthsAgo }
        },
        select: {
          status: true,
          createdAt: true,
          endTime: true
        }
      })
    ]);

    // Calculate Total Revenue & Total Pending Payments from all orders dynamically
    const allOrders = await this.prisma.order.findMany({
      include: {
        payments: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    let totalRevenue = 0;
    let totalPendingPayments = 0;

    for (const order of allOrders) {
      const paid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const total = Number(order.totalAmount);
      
      totalRevenue += paid;

      if (order.status !== 'FULLY_PAID') {
        const pending = total - paid;
        if (pending > 0) {
          totalPendingPayments += pending;
        }
      }
    }

    // Process Monthly Revenue Chart Data
    const monthlyRevenue = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const total = allPaymentsForRevenue
        .filter(p => {
          const pDate = new Date(p.createdAt);
          return pDate.getFullYear() === year && pDate.getMonth() === month;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      return { month: monthLabel, amount: total };
    });

    // Process Monthly Auctions Overview Chart Data
    const monthlyAuctions = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const year = d.getFullYear();
      const month = d.getMonth();

      const filtered = allAuctionsForMonthly.filter(a => {
        const aDate = new Date(a.createdAt);
        return aDate.getFullYear() === year && aDate.getMonth() === month;
      });

      const created = filtered.length;
      const completed = filtered.filter(a => a.status === 'ENDED_SOLD').length;
      const expired = filtered.filter(a => a.status === 'ENDED_UNSOLD').length;

      return {
        month: monthLabel,
        created,
        completed,
        expired
      };
    });

    // Format Latest Orders
    const formattedLatestOrders = latestOrders.map((order) => {
      const paidAmount = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalAmount = Number(order.totalAmount);
      const pendingAmount = Math.max(0, totalAmount - paidAmount);

      let orderType = 'Bid Win';
      if (order.auction) {
        if (order.auction.type === 'BUY_NOW_ONLY') {
          orderType = 'Buy Now';
        } else if (order.auction.type === 'BID_AND_BUY' && order.auction.buyItNowPrice && totalAmount === Number(order.auction.buyItNowPrice)) {
          orderType = 'Buy Now';
        }
      }

      // Map Payment Status
      let paymentStatus = 'Pending';
      if (order.status === 'FULLY_PAID' || pendingAmount <= 0) {
        paymentStatus = 'Paid';
      } else if (paidAmount > 0 && pendingAmount > 0) {
        paymentStatus = 'Partial';
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        product: order.auction?.product?.title || 'Unknown Product',
        productImage: order.auction?.product?.media?.[0]?.url || null,
        customer: order.buyer ? `${order.buyer.firstName} ${order.buyer.lastName || ''}`.trim() || order.buyer.email : 'Unknown Customer',
        orderType,
        totalAmount,
        paidAmount,
        pendingAmount,
        paymentStatus,
        orderStatus: order.status,
        createdAt: order.createdAt
      };
    });

    // Format Live Auctions
    const formattedLiveAuctions = liveAuctions.map((auc) => {
      let auctionType = 'Bid Only';
      if (auc.type === 'BUY_NOW_ONLY') {
        auctionType = 'Buy Now Only';
      } else if (auc.type === 'BID_AND_BUY') {
        auctionType = 'Bid & Buy';
      }

      return {
        id: auc.id,
        productImage: auc.product?.media?.[0]?.url || null,
        productName: auc.product?.title || 'Unknown',
        auctionType,
        category: auc.product?.category?.name || 'Uncategorized',
        basket: auc.product?.basket?.name || 'None',
        currentBid: Number(auc.currentBid),
        buyNowPrice: auc.buyItNowPrice ? Number(auc.buyItNowPrice) : null,
        bidCount: auc.bidCount,
        endingTime: auc.endTime,
        seller: auc.product?.seller ? auc.product.seller.companyName || `${auc.product.seller.user.firstName} ${auc.product.seller.user.lastName || ''}`.trim() : 'Unknown',
        status: auc.status
      };
    });

    return {
      kpis: {
        totalUsers,
        activeAuctions: activeAuctionsCount,
        pendingAuctions: pendingAuctionsCount,
        soldProducts: soldProductsCount,
        totalOrders: totalOrdersCount,
        revenue: totalRevenue,
        pendingPayments: totalPendingPayments,
        totalBids: totalBidsCount,
        featuredProducts: featuredProductsCount,
        totalCategories: totalCategoriesCount,
        totalBaskets: totalBasketsCount,
        totalSellers: totalSellersCount
      },
      charts: {
        monthlyRevenue,
        monthlyAuctions
      },
      latestOrders: formattedLatestOrders,
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName || ''}`.trim() || u.username || 'Anonymous',
        email: u.email,
        role: u.role?.name || 'Buyer',
        joinedDate: u.createdAt
      })),
      paymentOverview: {
        fullyPaid: paymentOverviewPaid,
        partialPaid: paymentOverviewPartial,
        pending: paymentOverviewPending
      },
      categorySummary: categoriesOverview.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat._count.products
      })),
      basketSummary: basketsOverview.map(bas => ({
        id: bas.id,
        name: bas.name,
        count: bas._count.products
      })),
      liveAuctions: formattedLiveAuctions
    };
  }
}
