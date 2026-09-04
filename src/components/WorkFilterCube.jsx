import React from 'react';
import { motion } from 'framer-motion';
import { NUMUNUMU_TEXT, useNumunumu } from '../NumunumuContext';
import { CUBE_ROUTE_TRANSITION_SECONDS } from '../utils/routeTransition';
import { getWorkCategoryLabel, getWorkCubeOrientation } from '../utils/works';

const WorkFilterCube = ({ category, onRouteAnimationComplete }) => {
  const { isNumunumuMode } = useNumunumu();
  const orientation = getWorkCubeOrientation(category);

  return (
    <div className="work-filter-cube-stage" aria-hidden="true">
      <motion.div
        className="work-filter-cube-route"
        data-shared-cube="works"
        layoutId="site-cube"
        transition={{ layout: { duration: CUBE_ROUTE_TRANSITION_SECONDS, ease: [0.22, 1, 0.36, 1] } }}
        onLayoutAnimationComplete={onRouteAnimationComplete}
      >
        <div
          className="work-filter-cube"
          style={{
            '--work-cube-rotate-x': `${orientation.x}deg`,
            '--work-cube-rotate-y': `${orientation.y}deg`,
          }}
        >
          <div className="work-filter-cube__face work-filter-cube__face--front">
            <span>{isNumunumuMode ? NUMUNUMU_TEXT : <><span>LIVE &amp;</span><br /><span>CULTURE</span></>}</span>
          </div>
          <div className="work-filter-cube__face work-filter-cube__face--right">
            {isNumunumuMode ? NUMUNUMU_TEXT : getWorkCategoryLabel('visual')}
          </div>
          <div className="work-filter-cube__face work-filter-cube__face--top">
            {isNumunumuMode ? NUMUNUMU_TEXT : getWorkCategoryLabel('music')}
          </div>
          <div className="work-filter-cube__face work-filter-cube__face--back">{isNumunumuMode ? NUMUNUMU_TEXT : 'ALL'}</div>
          <div className="work-filter-cube__face work-filter-cube__face--left">{isNumunumuMode ? NUMUNUMU_TEXT : 'SAN'}</div>
          <div className="work-filter-cube__face work-filter-cube__face--bottom">{isNumunumuMode ? NUMUNUMU_TEXT : 'WORKS'}</div>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkFilterCube;
