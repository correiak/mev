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
package edu.dfci.cccb.mev.core.support;

import static java.lang.Class.forName;
import static java.util.Arrays.asList;
import static us.levk.util.runtime.support.Annotations.brief;

import java.io.IOException;
import java.util.Collection;
import java.util.HashSet;

import lombok.extern.log4j.Log4j;

import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import us.levk.spring.context.support.FullClassPathScanningCandidateComponentProvider;
import edu.dfci.cccb.mev.api.annotation.Plugin;

/**
 * @author levk
 * 
 */
@Log4j
public class MevContextHolder {

  private static MevContext context = new MevContext () {

    private final Collection<Class<?>> configurations = new HashSet<> ();

    {
      log.info ("Initializing MeV context");

      try {
        for (BeanDefinition declaration : new FullClassPathScanningCandidateComponentProvider (false) {
          {
            addIncludeFilter (new AnnotationTypeFilter (Plugin.class));
          }

          protected boolean isCandidateComponent (AnnotatedBeanDefinition beanDefinition) {
            return true;
          }

          protected boolean isCandidateComponent (MetadataReader metadataReader) {
            try {
              return super.isCandidateComponent (metadataReader);
            } catch (IOException e) {
              return false;
            }
          }
        }.findCandidateComponents ())
          try {
            Class<?> clazz = forName (declaration.getBeanClassName ());
            if (clazz != null) {
              Package packege = clazz.getPackage ();
              if (packege != null) {
                Plugin plugin = packege.getAnnotation (Plugin.class);
                if (plugin != null) {
                  log.info ("Found " + brief (plugin) + " in " + packege);
                  configurations.addAll (asList (plugin.configurations ()));
                }
              }
            }
          } catch (ClassNotFoundException e) {
            log.error ("Failed on candidate check", e);
          }
      } catch (ClassNotFoundException e) {
        log.error ("Failed on candidate check", e);
      }
    }

    @Override
    public Collection<Class<?>> configurations () {
      return configurations;
    }
  };

  public MevContext context () {
    return context;
  }

  public static MevContextHolder contextHolder () {
    return new MevContextHolder ();
  }
}
