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
package edu.dfci.cccb.mev.analysis;

import static org.apache.log4j.Level.DEBUG;
import static org.apache.log4j.Level.ERROR;
import static org.apache.log4j.Level.INFO;
import static org.apache.log4j.Level.TRACE;
import static org.apache.log4j.Level.WARN;
import static us.levk.util.io.support.Provisionals.file;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintStream;
import java.util.HashMap;

import javax.script.ScriptException;

import lombok.extern.log4j.Log4j;

import org.apache.commons.io.IOUtils;
import org.apache.log4j.Level;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;
import org.apache.velocity.runtime.RuntimeServices;
import org.apache.velocity.runtime.log.LogChute;
import org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader;

import us.levk.util.io.implementation.Provisional;
import edu.dfci.cccb.mev.domain.AnnotationNotFoundException;
import edu.dfci.cccb.mev.domain.Heatmap;
import edu.dfci.cccb.mev.domain.MatrixSelection;
//import java.io.ByteArrayInputStream;
//import java.io.ByteArrayOutputStream;
//import java.io.InputStreamReader;
//import javax.script.ScriptEngine;
//import javax.script.ScriptEngineManager;

/**
 * @author levk
 * 
 */
@Log4j
public class Limma {

  // private static final ScriptEngine r = new ScriptEngineManager
  // ().getEngineByName ("R");
  private static final String script = "edu/dfci/cccb/mev/analysis/limma.R.vm";
  private static final String r = System.getProperty (Limma.class.getCanonicalName () + ".r", "Rscript");
  private static final VelocityEngine velocity = new VelocityEngine () {
    {
      setProperty (RESOURCE_LOADER, "classpath");
      setProperty ("classpath.resource.loader.class", ClasspathResourceLoader.class.getName ());
      setProperty (RUNTIME_LOG_LOGSYSTEM, new LogChute () {

        @Override
        public void log (int level, String message, Throwable t) {
          log.log (toLevel (level), message, t);
        }

        @Override
        public void log (int level, String message) {
          log.log (toLevel (level), message);
        }

        @Override
        public boolean isLevelEnabled (int level) {
          return log.isEnabledFor (toLevel (level));
        }

        @Override
        public void init (RuntimeServices rs) throws Exception {}

        private Level toLevel (int level) {
          switch (level) {
          case TRACE_ID:
            return TRACE;
          case DEBUG_ID:
            return DEBUG;
          case INFO_ID:
            return INFO;
          case WARN_ID:
            return WARN;
          case ERROR_ID:
            return ERROR;
          default:
            throw new IllegalArgumentException ("Undefined mapping for LogChute level " + level);
          }
        }
      });
    }
  };

  public static void execute (Heatmap heatmap,
                              String selection1,
                              String selection2,
                              final File output,
                              final File significant,
                              final File rnk,
                              String dimension) throws IOException,
                                               ScriptException,
                                               AnnotationNotFoundException {
    try (final Provisional input = file ();
         final Provisional configuration = file ();
         final Provisional script = file ();
         final OutputStreamWriter writer = new OutputStreamWriter (new FileOutputStream (script))) {
      if ("row".equals (dimension))
        configureRows (new FileOutputStream (configuration), heatmap, selection1, selection2);
      else
        configureColumns (new FileOutputStream (configuration), heatmap, selection1, selection2);
      heatmap.toStream (new FileOutputStream (input));
      if (log.isDebugEnabled ())
        try (BufferedReader readBack = new BufferedReader (new FileReader (input))) {
          log.debug ("Dump line 1: \"" + readBack.readLine () + "\"");
          log.debug ("Dump line 2: \"" + readBack.readLine () + "\"");
        }
      velocity.getTemplate (Limma.script).merge (new VelocityContext (new HashMap<String, String> () {
        private static final long serialVersionUID = 1L;

        {
          if (log.isDebugEnabled ())
            log.debug ("Running LIMMA with input "
                       + input.getAbsolutePath () + " configuration " + configuration.getAbsolutePath () + " output "
                       + output.getAbsolutePath () + " significant " + significant);
          put ("input", input.getAbsolutePath ());
          put ("configuration", configuration.getAbsolutePath ());
          put ("output", output.getAbsolutePath ());
          put ("significant", significant.getAbsolutePath ());
          put ("rnk", rnk.getAbsolutePath ());
        }
      }),
                                                 writer);
      writer.flush ();
      Process r = Runtime.getRuntime ().exec (Limma.r + " " + script.getAbsolutePath ());
      try {
        r.waitFor ();
      } catch (InterruptedException e) {
        log.error ("Interrupted while waiting for R", e);
      }
      if (log.isDebugEnabled ()) {
        ByteArrayOutputStream listing = new ByteArrayOutputStream ();
        IOUtils.copy (r.getErrorStream (), listing);
        log.debug ("Return value " + r.exitValue () + " error output:\n" + listing.toString ());
      }
      if (r.exitValue () != 0)
        throw new RuntimeException ("Non zero return value from R process " + r.exitValue ());
      // r.eval (new InputStreamReader (new ByteArrayInputStream
      // (script.toByteArray ())));
    }
  }

  private static void configureRows (OutputStream configuration, Heatmap heatmap, String s1, String s2) throws IOException {
    int rows = heatmap.getSummary ().rows ();
    MatrixSelection first = heatmap.getRowSelection (s1, 0, rows);
    MatrixSelection second = heatmap.getRowSelection (s2, 0, rows);
    PrintStream out = new PrintStream (configuration);
    for (int index = 0; index < rows; index++)
      out.println (index + "\t"
                   + (first.getIndices ().contains (index) ? 1 : (second.getIndices ().contains (index) ? 0 : -1)));
    out.flush ();
  }

  private static void configureColumns (OutputStream configuration, Heatmap heatmap, String s1, String s2) throws IOException {
    int columns = heatmap.getSummary ().columns ();
    MatrixSelection first = heatmap.getColumnSelection (s1, 0, columns);
    MatrixSelection second = heatmap.getColumnSelection (s2, 0, columns);
    PrintStream out = new PrintStream (configuration);
    for (int index = 0; index < columns; index++)
      out.println (index + "\t"
                   + (first.getIndices ().contains (index) ? 1 : (second.getIndices ().contains (index) ? 0 : -1)));
    out.flush ();
  }
}
