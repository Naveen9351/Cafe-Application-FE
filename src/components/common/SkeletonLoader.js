import React from 'react';
import styles from './SkeletonLoader.module.css';

export function TableMatrixSkeleton({ count = 8 }) {
  return (
    <div className={styles.tableGridSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.tableCardSkeleton}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.shimmer} style={{ width: '40px', height: '14px' }} />
            <div className={styles.shimmer} style={{ width: '28px', height: '14px', borderRadius: '10px' }} />
          </div>
          <div className={styles.shimmer} style={{ width: '70%', height: '20px', margin: '4px 0' }} />
          <div className={styles.shimmer} style={{ width: '50%', height: '12px' }} />
        </div>
      ))}
    </div>
  );
}

export function DishGridSkeleton({ count = 10, gridClassName }) {
  return (
    <div className={gridClassName || styles.dishGridSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.dishCardSkeleton}>
          <div className={styles.dishImgWrapSkeleton}>
            <div className={`${styles.shimmer} ${styles.dishImgSkeleton}`} />
            <div className={styles.dishImageOverlaySkeleton}>
              <div className={`${styles.shimmer} ${styles.dishCheckboxSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.dishBadgeSkeleton}`} />
            </div>
          </div>
          <div className={styles.dishBodySkeleton}>
            <div className={styles.dishTitleRowSkeleton}>
              <div className={`${styles.shimmer} ${styles.dishNameSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.dishPriceSkeleton}`} />
            </div>
            <div className={`${styles.shimmer} ${styles.dishVariantSkeleton}`} />
            <div className={styles.dishDescWrapSkeleton}>
              <div className={`${styles.shimmer} ${styles.dishDescLine1}`} />
              <div className={`${styles.shimmer} ${styles.dishDescLine2}`} />
            </div>
            <div className={styles.dishBottomRowSkeleton}>
              <div className={`${styles.shimmer} ${styles.dishToggleSkeleton}`} />
              <div className={styles.dishActionsSkeleton}>
                <div className={`${styles.shimmer} ${styles.dishBtnSkeleton}`} />
                <div className={`${styles.shimmer} ${styles.dishBtnSkeleton}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricsGridSkeleton({ count = 4 }) {
  return (
    <div className={styles.metricsGridSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.metricCardSkeleton}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.shimmer} style={{ width: '80px', height: '14px' }} />
            <div className={styles.shimmer} style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          </div>
          <div className={styles.shimmer} style={{ width: '120px', height: '28px' }} />
          <div className={styles.shimmer} style={{ width: '65%', height: '12px' }} />
        </div>
      ))}
    </div>
  );
}
