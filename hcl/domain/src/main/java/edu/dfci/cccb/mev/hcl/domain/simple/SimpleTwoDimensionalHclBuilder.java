/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package edu.dfci.cccb.mev.hcl.domain.simple;

import static edu.dfci.cccb.mev.dataset.domain.contract.Dimension.Type.COLUMN;
import static edu.dfci.cccb.mev.dataset.domain.contract.Dimension.Type.ROW;
import static java.util.Arrays.asList;

import java.util.AbstractList;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.TreeMap;

import lombok.EqualsAndHashCode;
import lombok.SneakyThrows;
import lombok.ToString;
import lombok.extern.log4j.Log4j;

import org.apache.commons.math3.exception.NotStrictlyPositiveException;
import org.apache.commons.math3.exception.OutOfRangeException;
import org.apache.commons.math3.linear.AbstractRealMatrix;
import org.apache.commons.math3.linear.RealMatrix;

import edu.dfci.cccb.mev.dataset.domain.contract.Dataset;
import edu.dfci.cccb.mev.dataset.domain.contract.DatasetException;
import edu.dfci.cccb.mev.dataset.domain.contract.Dimension;
import edu.dfci.cccb.mev.dataset.domain.contract.Dimension.Type;
import edu.dfci.cccb.mev.dataset.domain.contract.InvalidCoordinateException;
import edu.dfci.cccb.mev.dataset.domain.contract.InvalidDimensionTypeException;
import edu.dfci.cccb.mev.hcl.domain.contract.Branch;
import edu.dfci.cccb.mev.hcl.domain.contract.Hcl;
import edu.dfci.cccb.mev.hcl.domain.contract.Leaf;
import edu.dfci.cccb.mev.hcl.domain.contract.Linkage;
import edu.dfci.cccb.mev.hcl.domain.contract.Metric;
import edu.dfci.cccb.mev.hcl.domain.contract.Node;
import edu.dfci.cccb.mev.hcl.domain.prototype.AbstractHclBuilder;

/**
 * @author levk
 * 
 */
@ToString
@Log4j
@EqualsAndHashCode (callSuper = true)
public class SimpleTwoDimensionalHclBuilder extends AbstractHclBuilder {

  /* (non-Javadoc)
   * @see edu.dfci.cccb.mev.dataset.domain.contract.AnalysisBuilder#build() */
  @Override
  public Hcl build () throws DatasetException {
    return new SimpleHcl ().root (cluster (dataset (), dimension (), metric (), linkage ()))
                           .dimension (dimension ())
                           .dataset (dataset ())
                           .type (type ())
                           .name (name ());
  }

  private RealMatrix toRealMatrix (final Dataset dataset) {
    return new AbstractRealMatrix () {

      @Override
      public void setEntry (int row, int column, double value) throws OutOfRangeException {
        throw new UnsupportedOperationException ();
      }

      @Override
      @SneakyThrows (InvalidDimensionTypeException.class)
      public int getRowDimension () {
        return dataset.dimension (ROW).keys ().size ();
      }

      @Override
      @SneakyThrows ({ InvalidDimensionTypeException.class, InvalidCoordinateException.class })
      public double getEntry (int row, int column) throws OutOfRangeException {
        return dataset.values ().get (dataset.dimension (ROW).keys ().get (row),
                                      dataset.dimension (COLUMN).keys ().get (column));
      }

      @Override
      @SneakyThrows (InvalidDimensionTypeException.class)
      public int getColumnDimension () {
        return dataset.dimension (COLUMN).keys ().size ();
      }

      @Override
      public RealMatrix createMatrix (int rowDimension, int columnDimension) throws NotStrictlyPositiveException {
        throw new UnsupportedOperationException ();
      }

      @Override
      public RealMatrix copy () {
        throw new UnsupportedOperationException ();
      }
    };
  }

  private Node cluster (final Dataset dataset, Dimension dimension, Metric metric, Linkage linkage) throws DatasetException {
    final Type dimensionType = dimension.type ();
    final RealMatrix original = toRealMatrix (dataset);
    final int size = dimensionType == ROW ? original.getRowDimension () : original.getColumnDimension ();
    final int other = dimensionType == COLUMN ? original.getRowDimension () : original.getColumnDimension ();
    Iterator<Integer> enumerator = new Iterator<Integer> () {

      private int counter = -1;

      @Override
      public boolean hasNext () {
        return true;
      }

      @Override
      public Integer next () {
        counter--;
        if (counter > 0)
          counter = -1;
        return counter;
      }

      @Override
      public void remove () {
        throw new UnsupportedOperationException ();
      }
    };
    final double[][] distances = new double[size][size];

    log.debug ("Populating node hash");
    final Map<Integer, Node> genehash = new HashMap<Integer, Node> () {
      private static final long serialVersionUID = 1L;

      {
        for (int index = size; --index >= 0; put (index, nodeBuilder ().leaf (dataset.dimension (dimensionType)
                                                                                     .keys ()
                                                                                     .get (index))));
      }
    };
    TreeMap<Double, int[]> sorted = new TreeMap<> ();

    log.debug ("Populating distance matrix");
    for (int i = 0; i < size; i++) {
      for (int j = i + 1; j < size; j++) {
<<<<<<< HEAD:hcl/domain/src/main/java/edu/dfci/cccb/mev/hcl/domain/concrete/TwoDimensionalHcl.java
        // Distance metric calculation.
        double total = 0;
		String metric; // User-selected metric to go here.
        for (int k = 0; k < other; k++) {
          double left = dimensionType == ROW ? original.getEntry (i, k) : original.getEntry (k, i);
          double right = dimensionType == ROW ? original.getEntry (j, k) : original.getEntry (k, j);
          if (!isNaN (left) && !isNaN (right) && !isInfinite (left) && !isInfinite (right))
            total += DistanceMetric.calc(left, right, metric);
        }
        double distance = DistanceMetric.distance(total, metric, other);
=======
        double distance = metric.distance (new AbstractList<Double> () {

          private int i;

          @Override
          public Double get (int index) {
            return dimensionType == ROW ? original.getEntry (i, index) : original.getEntry (index, i);
          }

          @Override
          public int size () {
            return other;
          }

          private List<Double> initializeProjection (int i) {
            this.i = i;
            return this;
          }
        }.initializeProjection (i), new AbstractList<Double> () {

          private int j;

          @Override
          public Double get (int index) {
            return dimensionType == ROW ? original.getEntry (j, index) : original.getEntry (index, j);
          }

          @Override
          public int size () {
            return other;
          }

          private List<Double> initializeProjection (int j) {
            this.j = j;
            return this;
          }
        }.initializeProjection (j));
>>>>>>> dfci-cccb/master:hcl/domain/src/main/java/edu/dfci/cccb/mev/hcl/domain/simple/SimpleTwoDimensionalHclBuilder.java

        distances[i][j] = distance;
        distances[j][i] = distance;
        int[] genePair = { i, j };
        // Enter the distance calculated and the genes measured into a
        // treemap. Will be automatically sorted.
        sorted.put (distance, genePair);
      }
    }

    log.debug ("Aggregating");
    while (true) {
      // Get the first key of the TreeMap. Will be the shortest distance de
      // facto.
      final double minkey = (Double) sorted.firstKey ();
      int[] minValues = (int[]) sorted.firstEntry ().getValue ();

      final int value1 = minValues[0], value2 = minValues[1];
      // find

      Node cluster = nodeBuilder ().branch (minkey, genehash.get (value1), genehash.get (value2));
      int id = enumerator.next ();

      genehash.put (id, cluster);
      genehash.remove (value1);
      genehash.remove (value2);

      if (genehash.size () <= 1)
        break;

      // Iterate over all the current clusters to remeasure distance with the
      // previously clustered group.
      for (Entry<Integer, Node> e : genehash.entrySet ()) {
        Node c = e.getValue ();
        // Skip measuring the new cluster with itself.
        if (c == cluster)
          continue;

        List<Double> aggregation = new ArrayList<> ();
        // Get genes from each cluster. Distance is measured from each element
        // to every element.
<<<<<<< HEAD:hcl/domain/src/main/java/edu/dfci/cccb/mev/hcl/domain/concrete/TwoDimensionalHcl.java
		
		ArrayList<Integer> current_ele = traverse(dimension.keys(), c);
        ArrayList<Integer> created_ele = traverse(dimension.keys(), cluster);
		distance = ClusteringAlgorithm.cluster(method, current_ele, created_ele, distances);
=======
        for (int current : traverse (dimension.keys (), c))
          for (int created : traverse (dimension.keys (), cluster))
            aggregation.add (distances[current][created]);
>>>>>>> dfci-cccb/master:hcl/domain/src/main/java/edu/dfci/cccb/mev/hcl/domain/simple/SimpleTwoDimensionalHclBuilder.java

        int[] valuePair = { e.getKey (), id };
        sorted.put (linkage.aggregate (aggregation), valuePair);
      }

      // Get the shortest distance.
      // Check to make sure shortest distance does not include a gene pair
      // that
      // has already had its elements clustered.
      boolean minimized = false;
      while (!minimized) {
        double mk = sorted.firstKey ();
        minValues = sorted.firstEntry ().getValue ();
        // If the gene pair is not present in the current gene set, remove
        // this distance.
        if (!genehash.containsKey (minValues[0]) || !genehash.containsKey (minValues[1]))
          sorted.remove (mk);
        else
          minimized = true;
      }
    }

    Node result = genehash.entrySet ().iterator ().next ().getValue ();
    log.debug ("Clustered " + result);
    return result;
  }

  private List<Integer> traverse (List<String> keys, Node node) {
    if (node instanceof Leaf) {
      for (int index = keys.size (); --index >= 0;) {
        if (((Leaf) node).name ().equals (keys.get (index)))
          return new ArrayList<Integer> (asList (index));
      }
      throw new IllegalStateException ();
    } else {
      ArrayList<Integer> traversal = new ArrayList<Integer> ();
      for (Node child : ((Branch) node).children ())
        traversal.addAll (traverse (keys, child));
      return traversal;
    }
  }
}
